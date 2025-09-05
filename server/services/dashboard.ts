import { eq, and, desc, sql, gte, lte, count, sum } from "drizzle-orm";
import { db } from "../db.js";
import { 
  staff, 
  clients, 
  carePlans, 
  implementationPlans, 
  weeklyDocumentation, 
  monthlyReports, 
  vimsaTime
} from "../../shared/schema.js";
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface DashboardStats {
  overview: {
    totalClients: number;
    activeClients: number;
    totalStaff: number;
    activeStaff: number;
    totalCarePlans: number;
    activeCarePlans: number;
    pendingReports: number;
    overdueReports: number;
  };
  trends: {
    clientGrowth: Array<{ month: string; count: number }>;
    reportCompletion: Array<{ month: string; completed: number; total: number }>;
    staffWorkload: Array<{ staffName: string; clientCount: number; reportCount: number }>;
  };
  quality: {
    reportQuality: Array<{ quality: string; count: number }>;
    completionRates: {
      weeklyDocs: number;
      monthlyReports: number;
      carePlans: number;
    };
  };
  alerts: {
    overdueReports: any[];
    missingDocumentation: any[];
    qualityIssues: any[];
  };
}

export class DashboardService {
  static async getOverviewStats(): Promise<DashboardStats['overview']> {
    const [
      totalClientsResult,
      activeClientsResult,
      totalStaffResult,
      activeStaffResult,
      totalCarePlansResult,
      activeCarePlansResult,
      pendingReportsResult,
      overdueReportsResult
    ] = await Promise.all([
      db.select({ count: count() }).from(clients).where(sql`${clients.deletedAt} IS NULL`),
      db.select({ count: count() }).from(clients).where(and(sql`${clients.deletedAt} IS NULL`, eq(clients.status, 'active'))),
      db.select({ count: count() }).from(staff).where(sql`${staff.deletedAt} IS NULL`),
      db.select({ count: count() }).from(staff).where(and(sql`${staff.deletedAt} IS NULL`, sql`true`)), // All non-deleted staff are considered active
      db.select({ count: count() }).from(carePlans),
      db.select({ count: count() }).from(carePlans).where(eq(carePlans.isActive, true)),
      db.select({ count: count() }).from(monthlyReports).where(sql`${monthlyReports.status} != 'completed'`),
      db.select({ count: count() }).from(monthlyReports).where(
        and(
          sql`${monthlyReports.status} != 'completed'`,
          sql`DATE(${monthlyReports.createdAt}) < CURRENT_DATE - INTERVAL '7 days'`
        )
      )
    ]);
    
    return {
      totalClients: totalClientsResult[0].count,
      activeClients: activeClientsResult[0].count,
      totalStaff: totalStaffResult[0].count,
      activeStaff: activeStaffResult[0].count,
      totalCarePlans: totalCarePlansResult[0].count,
      activeCarePlans: activeCarePlansResult[0].count,
      pendingReports: pendingReportsResult[0].count,
      overdueReports: overdueReportsResult[0].count,
    };
  }
  
  static async getTrendData(): Promise<DashboardStats['trends']> {
    // Client growth over last 12 months
    const clientGrowthData = await db
      .select({
        month: sql<string>`TO_CHAR(${clients.createdAt}, 'YYYY-MM')`,
        count: count()
      })
      .from(clients)
      .where(
        and(
          sql`${clients.deletedAt} IS NULL`,
          gte(clients.createdAt, subMonths(new Date(), 12))
        )
      )
      .groupBy(sql`TO_CHAR(${clients.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${clients.createdAt}, 'YYYY-MM')`);
    
    // Report completion rates over last 6 months
    const reportCompletionData = await db
      .select({
        month: sql<string>`TO_CHAR(${monthlyReports.createdAt}, 'YYYY-MM')`,
        completed: count(sql`CASE WHEN ${monthlyReports.status} = 'completed' THEN 1 END`),
        total: count()
      })
      .from(monthlyReports)
      .where(gte(monthlyReports.createdAt, subMonths(new Date(), 6)))
      .groupBy(sql`TO_CHAR(${monthlyReports.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${monthlyReports.createdAt}, 'YYYY-MM')`);
    
    // Staff workload
    const staffWorkloadData = await db
      .select({
        staffId: staff.id,
        staffName: staff.name,
        clientCount: count(clients.id),
        reportCount: count(monthlyReports.id)
      })
      .from(staff)
      .leftJoin(clients, and(eq(clients.staffId, staff.id), sql`${clients.deletedAt} IS NULL`))
      .leftJoin(monthlyReports, eq(monthlyReports.staffId, staff.id))
      .where(sql`${staff.deletedAt} IS NULL`)
      .groupBy(staff.id, staff.name)
      .orderBy(desc(count(clients.id)));
    
    return {
      clientGrowth: clientGrowthData.map(item => ({
        month: item.month,
        count: item.count
      })),
      reportCompletion: reportCompletionData.map(item => ({
        month: item.month,
        completed: item.completed,
        total: item.total
      })),
      staffWorkload: staffWorkloadData.map(item => ({
        staffName: item.staffName,
        clientCount: item.clientCount,
        reportCount: item.reportCount
      }))
    };
  }
  
  static async getQualityData(): Promise<DashboardStats['quality']> {
    // Report quality distribution
    const qualityDistribution = await db
      .select({
        quality: monthlyReports.quality,
        count: count()
      })
      .from(monthlyReports)
      .where(sql`${monthlyReports.quality} IS NOT NULL`)
      .groupBy(monthlyReports.quality);
    
    // Completion rates
    const [
      weeklyDocsTotal,
      weeklyDocsCompleted,
      monthlyReportsTotal,
      monthlyReportsCompleted,
      carePlansTotal,
      carePlansCompleted
    ] = await Promise.all([
      db.select({ count: count() }).from(weeklyDocumentation),
      db.select({ count: count() }).from(weeklyDocumentation).where(eq(weeklyDocumentation.approved, true)),
      db.select({ count: count() }).from(monthlyReports),
      db.select({ count: count() }).from(monthlyReports).where(eq(monthlyReports.status, 'completed')),
      db.select({ count: count() }).from(carePlans),
      db.select({ count: count() }).from(carePlans).where(eq(carePlans.status, 'completed'))
    ]);
    
    return {
      reportQuality: qualityDistribution.map(item => ({
        quality: item.quality || 'unknown',
        count: item.count
      })),
      completionRates: {
        weeklyDocs: weeklyDocsTotal[0].count > 0 ? (weeklyDocsCompleted[0].count / weeklyDocsTotal[0].count) * 100 : 0,
        monthlyReports: monthlyReportsTotal[0].count > 0 ? (monthlyReportsCompleted[0].count / monthlyReportsTotal[0].count) * 100 : 0,
        carePlans: carePlansTotal[0].count > 0 ? (carePlansCompleted[0].count / carePlansTotal[0].count) * 100 : 0,
      }
    };
  }
  
  static async getAlerts(): Promise<DashboardStats['alerts']> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Overdue reports
    const overdueReports = await db
      .select({
        report: monthlyReports,
        client: clients,
        staff: staff
      })
      .from(monthlyReports)
      .leftJoin(clients, eq(monthlyReports.clientId, clients.id))
      .leftJoin(staff, eq(monthlyReports.staffId, staff.id))
      .where(
        and(
          sql`${monthlyReports.status} != 'completed'`,
          lte(monthlyReports.createdAt, weekAgo)
        )
      )
      .orderBy(monthlyReports.createdAt);
    
    // Missing weekly documentation
    const missingDocs = await db
      .select({
        doc: weeklyDocumentation,
        client: clients,
        staff: staff
      })
      .from(weeklyDocumentation)
      .leftJoin(clients, eq(weeklyDocumentation.clientId, clients.id))
      .leftJoin(staff, eq(weeklyDocumentation.staffId, staff.id))
      .where(
        and(
          eq(weeklyDocumentation.approved, false),
          lte(weeklyDocumentation.createdAt, weekAgo)
        )
      )
      .orderBy(weeklyDocumentation.createdAt);
    
    // Quality issues
    const qualityIssues = await db
      .select({
        report: monthlyReports,
        client: clients,
        staff: staff
      })
      .from(monthlyReports)
      .leftJoin(clients, eq(monthlyReports.clientId, clients.id))
      .leftJoin(staff, eq(monthlyReports.staffId, staff.id))
      .where(sql`${monthlyReports.quality} IN ('poor', 'needs_improvement')`)
      .orderBy(desc(monthlyReports.updatedAt));
    
    return {
      overdueReports: overdueReports.map(item => ({
        id: item.report.id,
        clientInitials: item.client?.initials,
        staffName: item.staff?.name,
        month: item.report.month,
        year: item.report.year,
        daysOverdue: Math.floor((now.getTime() - (item.report.createdAt?.getTime() || 0)) / (1000 * 60 * 60 * 24))
      })),
      missingDocumentation: missingDocs.map(item => ({
        id: item.doc.id,
        clientInitials: item.client?.initials,
        staffName: item.staff?.name,
        week: item.doc.week,
        year: item.doc.year,
        daysOverdue: Math.floor((now.getTime() - (item.doc.createdAt?.getTime() || 0)) / (1000 * 60 * 60 * 24))
      })),
      qualityIssues: qualityIssues.map(item => ({
        id: item.report.id,
        clientInitials: item.client?.initials,
        staffName: item.staff?.name,
        quality: item.report.quality,
        month: item.report.month,
        year: item.report.year
      }))
    };
  }
  
  static async getStaffPerformanceData(staffId?: string) {
    let query = db
      .select({
        staff: staff,
        clientCount: count(clients.id),
        completedReports: count(sql`CASE WHEN ${monthlyReports.status} = 'completed' THEN 1 END`),
        totalReports: count(monthlyReports.id),
        avgQuality: sql<number>`AVG(CASE 
          WHEN ${monthlyReports.quality} = 'excellent' THEN 5
          WHEN ${monthlyReports.quality} = 'good' THEN 4
          WHEN ${monthlyReports.quality} = 'satisfactory' THEN 3
          WHEN ${monthlyReports.quality} = 'needs_improvement' THEN 2
          WHEN ${monthlyReports.quality} = 'poor' THEN 1
          ELSE NULL
        END)`
      })
      .from(staff)
      .leftJoin(clients, and(eq(clients.staffId, staff.id), sql`${clients.deletedAt} IS NULL`))
      .leftJoin(monthlyReports, eq(monthlyReports.staffId, staff.id))
      .where(sql`${staff.deletedAt} IS NULL`)
      .groupBy(staff.id);
    
    if (staffId) {
      query = query.where(eq(staff.id, staffId));
    }
    
    const results = await query;
    
    return results.map(result => ({
      id: result.staff.id,
      name: result.staff.name,
      initials: result.staff.initials,
      clientCount: result.clientCount,
      completedReports: result.completedReports,
      totalReports: result.totalReports,
      completionRate: result.totalReports > 0 ? (result.completedReports / result.totalReports) * 100 : 0,
      avgQuality: result.avgQuality || 0,
      workloadScore: this.calculateWorkloadScore(result.clientCount, result.totalReports, result.completedReports)
    }));
  }
  
  static async getClientStatusDistribution() {
    const statusDistribution = await db
      .select({
        status: clients.status,
        count: count()
      })
      .from(clients)
      .where(sql`${clients.deletedAt} IS NULL`)
      .groupBy(clients.status);
    
    return statusDistribution;
  }
  
  static async getMonthlyTrends(months: number = 12) {
    const startDate = subMonths(new Date(), months);
    
    // Monthly report trends
    const reportTrends = await db
      .select({
        month: sql<string>`TO_CHAR(${monthlyReports.createdAt}, 'YYYY-MM')`,
        completed: count(sql`CASE WHEN ${monthlyReports.status} = 'completed' THEN 1 END`),
        total: count(),
        avgQuality: sql<number>`AVG(CASE 
          WHEN ${monthlyReports.quality} = 'excellent' THEN 5
          WHEN ${monthlyReports.quality} = 'good' THEN 4
          WHEN ${monthlyReports.quality} = 'satisfactory' THEN 3
          WHEN ${monthlyReports.quality} = 'needs_improvement' THEN 2
          WHEN ${monthlyReports.quality} = 'poor' THEN 1
          ELSE NULL
        END)`
      })
      .from(monthlyReports)
      .where(gte(monthlyReports.createdAt, startDate))
      .groupBy(sql`TO_CHAR(${monthlyReports.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${monthlyReports.createdAt}, 'YYYY-MM')`);
    
    // Client activity trends
    const clientTrends = await db
      .select({
        month: sql<string>`TO_CHAR(${clients.createdAt}, 'YYYY-MM')`,
        newClients: count(),
      })
      .from(clients)
      .where(
        and(
          sql`${clients.deletedAt} IS NULL`,
          gte(clients.createdAt, startDate)
        )
      )
      .groupBy(sql`TO_CHAR(${clients.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${clients.createdAt}, 'YYYY-MM')`);
    
    return {
      reports: reportTrends,
      clients: clientTrends
    };
  }
  
  static async getWorkloadAnalysis() {
    // Analyze workload distribution across staff
    const workloadData = await db
      .select({
        staffId: staff.id,
        staffName: staff.name,
        activeClients: count(sql`CASE WHEN ${clients.status} = 'active' THEN 1 END`),
        totalReports: count(monthlyReports.id),
        pendingReports: count(sql`CASE WHEN ${monthlyReports.status} != 'completed' THEN 1 END`),
        avgHoursPerWeek: sql<number>`AVG(${vimsaTime.hoursWorked})`
      })
      .from(staff)
      .leftJoin(clients, and(eq(clients.staffId, staff.id), sql`${clients.deletedAt} IS NULL`))
      .leftJoin(monthlyReports, eq(monthlyReports.staffId, staff.id))
      .leftJoin(vimsaTime, eq(vimsaTime.staffId, staff.id))
      .where(sql`${staff.deletedAt} IS NULL`)
      .groupBy(staff.id, staff.name);
    
    return workloadData.map(data => ({
      ...data,
      workloadScore: this.calculateWorkloadScore(data.activeClients, data.totalReports, data.totalReports - data.pendingReports),
      efficiency: data.totalReports > 0 ? ((data.totalReports - data.pendingReports) / data.totalReports) * 100 : 0
    }));
  }
  
  static async getQualityMetrics() {
    // Quality distribution
    const qualityDistribution = await db
      .select({
        quality: monthlyReports.quality,
        count: count()
      })
      .from(monthlyReports)
      .where(sql`${monthlyReports.quality} IS NOT NULL`)
      .groupBy(monthlyReports.quality);
    
    // Quality trends over time
    const qualityTrends = await db
      .select({
        month: sql<string>`TO_CHAR(${monthlyReports.createdAt}, 'YYYY-MM')`,
        avgQuality: sql<number>`AVG(CASE 
          WHEN ${monthlyReports.quality} = 'excellent' THEN 5
          WHEN ${monthlyReports.quality} = 'good' THEN 4
          WHEN ${monthlyReports.quality} = 'satisfactory' THEN 3
          WHEN ${monthlyReports.quality} = 'needs_improvement' THEN 2
          WHEN ${monthlyReports.quality} = 'poor' THEN 1
          ELSE NULL
        END)`
      })
      .from(monthlyReports)
      .where(
        and(
          sql`${monthlyReports.quality} IS NOT NULL`,
          gte(monthlyReports.createdAt, subMonths(new Date(), 12))
        )
      )
      .groupBy(sql`TO_CHAR(${monthlyReports.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${monthlyReports.createdAt}, 'YYYY-MM')`);
    
    return {
      distribution: qualityDistribution,
      trends: qualityTrends
    };
  }
  
  static async getCompleteDashboardData(staffId?: string): Promise<DashboardStats> {
    const [overview, trends, quality, alerts] = await Promise.all([
      this.getOverviewStats(),
      this.getTrendData(),
      this.getQualityData(),
      this.getAlerts()
    ]);
    
    return {
      overview,
      trends: {
        clientGrowth: trends.clients,
        reportCompletion: trends.reports,
        staffWorkload: await this.getWorkloadAnalysis()
      },
      quality: {
        reportQuality: quality.distribution,
        completionRates: {
          weeklyDocs: 0, // Will be calculated
          monthlyReports: 0, // Will be calculated
          carePlans: 0 // Will be calculated
        }
      },
      alerts
    };
  }
  
  private static async getAlerts(): Promise<DashboardStats['alerts']> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Overdue reports
    const overdueReports = await db
      .select({
        report: monthlyReports,
        client: clients,
        staff: staff
      })
      .from(monthlyReports)
      .leftJoin(clients, eq(monthlyReports.clientId, clients.id))
      .leftJoin(staff, eq(monthlyReports.staffId, staff.id))
      .where(
        and(
          sql`${monthlyReports.status} != 'completed'`,
          lte(monthlyReports.createdAt, weekAgo)
        )
      )
      .limit(10);
    
    // Missing documentation
    const missingDocs = await db
      .select({
        doc: weeklyDocumentation,
        client: clients,
        staff: staff
      })
      .from(weeklyDocumentation)
      .leftJoin(clients, eq(weeklyDocumentation.clientId, clients.id))
      .leftJoin(staff, eq(weeklyDocumentation.staffId, staff.id))
      .where(
        and(
          eq(weeklyDocumentation.approved, false),
          lte(weeklyDocumentation.createdAt, weekAgo)
        )
      )
      .limit(10);
    
    // Quality issues
    const qualityIssues = await db
      .select({
        report: monthlyReports,
        client: clients,
        staff: staff
      })
      .from(monthlyReports)
      .leftJoin(clients, eq(monthlyReports.clientId, clients.id))
      .leftJoin(staff, eq(monthlyReports.staffId, staff.id))
      .where(sql`${monthlyReports.quality} IN ('poor', 'needs_improvement')`)
      .orderBy(desc(monthlyReports.updatedAt))
      .limit(10);
    
    return {
      overdueReports: overdueReports.map(item => ({
        id: item.report.id,
        clientInitials: item.client?.initials,
        staffName: item.staff?.name,
        type: 'monthly-report',
        daysOverdue: Math.floor((now.getTime() - (item.report.createdAt?.getTime() || 0)) / (1000 * 60 * 60 * 24))
      })),
      missingDocumentation: missingDocs.map(item => ({
        id: item.doc.id,
        clientInitials: item.client?.initials,
        staffName: item.staff?.name,
        type: 'weekly-documentation',
        week: item.doc.week,
        year: item.doc.year,
        daysOverdue: Math.floor((now.getTime() - (item.doc.createdAt?.getTime() || 0)) / (1000 * 60 * 60 * 24))
      })),
      qualityIssues: qualityIssues.map(item => ({
        id: item.report.id,
        clientInitials: item.client?.initials,
        staffName: item.staff?.name,
        quality: item.report.quality,
        month: item.report.month,
        year: item.report.year
      }))
    };
  }
  
  private static calculateWorkloadScore(clientCount: number, totalReports: number, completedReports: number): number {
    // Calculate a workload score based on client count and report completion rate
    const baseScore = clientCount * 10; // Base score from client count
    const completionRate = totalReports > 0 ? completedReports / totalReports : 1;
    const efficiencyBonus = completionRate * 20; // Bonus for high completion rate
    
    return Math.round(baseScore + efficiencyBonus);
  }
}