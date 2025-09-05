import { databaseService } from "./database.js";
import type { Staff, Client, WeeklyDocumentation, MonthlyReport, CarePlan } from "../../shared/schema.js";

export interface DashboardStats {
  totalStaff: number;
  totalClients: number;
  totalWeeklyDocs: number;
  totalMonthlyReports: number;
  totalCarePlans: number;
  totalImplementationPlans: number;
  totalVimsaTime: number;
}

export interface WeeklyStats {
  week: number;
  year: number;
  total: number;
  completed: number;
  pending: number;
  approved: number;
  notApproved: number;
}

export interface MonthlyStats {
  month: number;
  year: number;
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
}

export interface QualityMetrics {
  totalAssessments: number;
  excellent: number;
  good: number;
  satisfactory: number;
  needsImprovement: number;
  averageScore: number;
}

export interface StaffPerformance {
  staffId: string;
  staffName: string;
  totalClients: number;
  completedWeeklyDocs: number;
  completedMonthlyReports: number;
  averageQualityScore: number;
  onTimeCompletionRate: number;
}

export interface ClientOverview {
  clientId: string;
  clientInitials: string;
  staffName: string;
  lastWeeklyDoc: Date | null;
  lastMonthlyReport: Date | null;
  carePlanStatus: string;
  qualityAssessment: string;
}

export interface TrendData {
  period: string;
  weeklyDocs: number;
  monthlyReports: number;
  qualityScore: number;
}

export class DashboardService {
  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalStaff,
      totalClients,
      totalWeeklyDocs,
      totalMonthlyReports,
      totalCarePlans,
      totalImplementationPlans,
      totalVimsaTime,
    ] = await Promise.all([
      databaseService.getDashboardStats(),
      databaseService.getAllClients(),
      databaseService.getAllWeeklyDocumentation(),
      databaseService.getAllMonthlyReports(),
      databaseService.getAllCarePlans(),
      databaseService.getAllImplementationPlans(),
      databaseService.getAllVimsaTime(),
    ]);

    return {
      totalStaff: totalStaff.totalStaff,
      totalClients: totalStaff.totalClients,
      totalWeeklyDocs: totalStaff.totalWeeklyDocs,
      totalMonthlyReports: totalStaff.totalMonthlyReports,
      totalCarePlans: totalCarePlans.length,
      totalImplementationPlans: totalImplementationPlans.length,
      totalVimsaTime: totalVimsaTime.length,
    };
  }

  async getWeeklyStats(year: number, week?: number): Promise<WeeklyStats[]> {
    const weeklyDocs = await databaseService.getAllWeeklyDocumentation();
    
    if (week) {
      // Return stats for specific week
      const weekDocs = weeklyDocs.filter(doc => doc.year === year && doc.week === week);
      return [this.calculateWeeklyStats(weekDocs, year, week)];
    } else {
      // Return stats for all weeks in the year
      const yearDocs = weeklyDocs.filter(doc => doc.year === year);
      const weeks = [...new Set(yearDocs.map(doc => doc.week))].sort((a, b) => a - b);
      
      return weeks.map(weekNum => 
        this.calculateWeeklyStats(yearDocs.filter(doc => doc.week === weekNum), year, weekNum)
      );
    }
  }

  async getMonthlyStats(year: number, month?: number): Promise<MonthlyStats[]> {
    const monthlyReports = await databaseService.getAllMonthlyReports();
    
    if (month) {
      // Return stats for specific month
      const monthReports = monthlyReports.filter(report => report.year === year && report.month === month);
      return [this.calculateMonthlyStats(monthReports, year, month)];
    } else {
      // Return stats for all months in the year
      const yearReports = monthlyReports.filter(report => report.year === year);
      const months = [...new Set(yearReports.map(report => report.month))].sort((a, b) => a - b);
      
      return months.map(monthNum => 
        this.calculateMonthlyStats(yearReports.filter(report => report.month === monthNum), year, monthNum)
      );
    }
  }

  async getQualityMetrics(): Promise<QualityMetrics> {
    const weeklyDocs = await databaseService.getAllWeeklyDocumentation();
    const monthlyReports = await databaseService.getAllMonthlyReports();
    
    const assessments = [
      ...weeklyDocs.map(doc => doc.qualityAssessment),
      ...monthlyReports.map(report => report.quality),
    ].filter(assessment => assessment && assessment !== 'pending');

    const totalAssessments = assessments.length;
    const excellent = assessments.filter(a => a === 'excellent').length;
    const good = assessments.filter(a => a === 'good').length;
    const satisfactory = assessments.filter(a => a === 'satisfactory').length;
    const needsImprovement = assessments.filter(a => a === 'needs_improvement').length;

    // Calculate average score (1-5 scale)
    const scoreMap: Record<string, number> = {
      'excellent': 5,
      'good': 4,
      'satisfactory': 3,
      'needs_improvement': 2,
      'poor': 1,
    };

    const totalScore = assessments.reduce((sum, assessment) => sum + (scoreMap[assessment] || 0), 0);
    const averageScore = totalAssessments > 0 ? totalScore / totalAssessments : 0;

    return {
      totalAssessments,
      excellent,
      good,
      satisfactory,
      needsImprovement,
      averageScore: Math.round(averageScore * 100) / 100,
    };
  }

  async getStaffPerformance(): Promise<StaffPerformance[]> {
    const allStaff = await databaseService.getAllStaff();
    const allClients = await databaseService.getAllClients();
    const allWeeklyDocs = await databaseService.getAllWeeklyDocumentation();
    const allMonthlyReports = await databaseService.getAllMonthlyReports();

    const performance: StaffPerformance[] = [];

    for (const staff of allStaff) {
      const staffClients = allClients.filter(client => client.staffId === staff.id);
      const staffWeeklyDocs = allWeeklyDocs.filter(doc => doc.staffId === staff.id);
      const staffMonthlyReports = allMonthlyReports.filter(report => report.staffId === staff.id);

      const completedWeeklyDocs = staffWeeklyDocs.filter(doc => doc.approved).length;
      const completedMonthlyReports = staffMonthlyReports.filter(report => report.status === 'completed').length;

      // Calculate quality score
      const qualityScores = [
        ...staffWeeklyDocs.map(doc => this.getQualityScore(doc.qualityAssessment)),
        ...staffMonthlyReports.map(report => this.getQualityScore(report.quality)),
      ].filter(score => score > 0);

      const averageQualityScore = qualityScores.length > 0 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
        : 0;

      // Calculate on-time completion rate
      const totalDeadlines = staffClients.length * 52; // Weekly docs per year
      const onTimeCompletions = staffWeeklyDocs.filter(doc => doc.approved).length;
      const onTimeCompletionRate = totalDeadlines > 0 ? (onTimeCompletions / totalDeadlines) * 100 : 0;

      performance.push({
        staffId: staff.id,
        staffName: staff.name,
        totalClients: staffClients.length,
        completedWeeklyDocs,
        completedMonthlyReports,
        averageQualityScore: Math.round(averageQualityScore * 100) / 100,
        onTimeCompletionRate: Math.round(onTimeCompletionRate * 100) / 100,
      });
    }

    return performance.sort((a, b) => b.averageQualityScore - a.averageQualityScore);
  }

  async getClientOverview(): Promise<ClientOverview[]> {
    const allClients = await databaseService.getAllClients();
    const allStaff = await databaseService.getAllStaff();
    const allWeeklyDocs = await databaseService.getAllWeeklyDocumentation();
    const allMonthlyReports = await databaseService.getAllMonthlyReports();
    const allCarePlans = await databaseService.getAllCarePlans();

    const overview: ClientOverview[] = [];

    for (const client of allClients) {
      const staff = allStaff.find(s => s.id === client.staffId);
      const clientWeeklyDocs = allWeeklyDocs.filter(doc => doc.clientId === client.id);
      const clientMonthlyReports = allMonthlyReports.filter(report => report.clientId === client.id);
      const clientCarePlan = allCarePlans.find(plan => plan.clientId === client.id);

      // Get last weekly documentation
      const lastWeeklyDoc = clientWeeklyDocs.length > 0
        ? clientWeeklyDocs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : null;

      // Get last monthly report
      const lastMonthlyReport = clientMonthlyReports.length > 0
        ? clientMonthlyReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : null;

      // Determine care plan status
      let carePlanStatus = 'none';
      if (clientCarePlan) {
        const lastUpdated = new Date(clientCarePlan.updatedAt);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        carePlanStatus = lastUpdated > sixMonthsAgo ? 'current' : 'needs_update';
      }

      // Get latest quality assessment
      const latestWeeklyDoc = clientWeeklyDocs
        .filter(doc => doc.qualityAssessment && doc.qualityAssessment !== 'pending')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      const latestMonthlyReport = clientMonthlyReports
        .filter(report => report.quality && report.quality !== 'pending')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      let qualityAssessment = 'pending';
      if (latestWeeklyDoc && latestMonthlyReport) {
        const weeklyDate = new Date(latestWeeklyDoc.createdAt);
        const monthlyDate = new Date(latestMonthlyReport.createdAt);
        qualityAssessment = weeklyDate > monthlyDate 
          ? latestWeeklyDoc.qualityAssessment 
          : latestMonthlyReport.quality;
      } else if (latestWeeklyDoc) {
        qualityAssessment = latestWeeklyDoc.qualityAssessment;
      } else if (latestMonthlyReport) {
        qualityAssessment = latestMonthlyReport.quality;
      }

      overview.push({
        clientId: client.id,
        clientInitials: client.initials,
        staffName: staff?.name || 'Unknown',
        lastWeeklyDoc,
        lastMonthlyReport,
        carePlanStatus,
        qualityAssessment,
      });
    }

    return overview;
  }

  async getTrendData(period: 'weekly' | 'monthly', months: number = 12): Promise<TrendData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    const weeklyDocs = await databaseService.getAllWeeklyDocumentation();
    const monthlyReports = await databaseService.getAllMonthlyReports();

    const trends: TrendData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const week = this.getWeekNumber(currentDate);

      let weeklyDocsCount = 0;
      let monthlyReportsCount = 0;
      let qualityScore = 0;
      let qualityCount = 0;

      if (period === 'weekly') {
        const weekDocs = weeklyDocs.filter(doc => doc.year === year && doc.week === week);
        weeklyDocsCount = weekDocs.length;
        
        // Calculate quality score for the week
        const weekQualityScores = weekDocs
          .map(doc => this.getQualityScore(doc.qualityAssessment))
          .filter(score => score > 0);
        
        if (weekQualityScores.length > 0) {
          qualityScore = weekQualityScores.reduce((sum, score) => sum + score, 0);
          qualityCount = weekQualityScores.length;
        }
      } else {
        const monthReports = monthlyReports.filter(report => report.year === year && report.month === month);
        monthlyReportsCount = monthReports.length;
        
        // Calculate quality score for the month
        const monthQualityScores = monthReports
          .map(report => this.getQualityScore(report.quality))
          .filter(score => score > 0);
        
        if (monthQualityScores.length > 0) {
          qualityScore = monthQualityScores.reduce((sum, score) => sum + score, 0);
          qualityCount = monthQualityScores.length;
        }
      }

      const periodLabel = period === 'weekly' 
        ? `V${week} ${year}` 
        : `${this.getMonthName(month)} ${year}`;

      trends.push({
        period: periodLabel,
        weeklyDocs: weeklyDocsCount,
        monthlyReports: monthlyReportsCount,
        qualityScore: qualityCount > 0 ? Math.round((qualityScore / qualityCount) * 100) / 100 : 0,
      });

      if (period === 'weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }

    return trends;
  }

  async getCompletionRates(): Promise<{
    weeklyCompletion: number;
    monthlyCompletion: number;
    carePlanCompletion: number;
  }> {
    const allStaff = await databaseService.getAllStaff();
    const allClients = await databaseService.getAllClients();
    const allWeeklyDocs = await databaseService.getAllWeeklyDocumentation();
    const allMonthlyReports = await databaseService.getAllMonthlyReports();
    const allCarePlans = await databaseService.getAllCarePlans();

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentWeek = this.getWeekNumber(currentDate);

    // Weekly completion rate
    const expectedWeeklyDocs = allClients.length;
    const completedWeeklyDocs = allWeeklyDocs.filter(doc => 
      doc.year === currentYear && doc.week === currentWeek && doc.approved
    ).length;
    const weeklyCompletion = expectedWeeklyDocs > 0 ? (completedWeeklyDocs / expectedWeeklyDocs) * 100 : 0;

    // Monthly completion rate
    const expectedMonthlyReports = allClients.length;
    const completedMonthlyReports = allMonthlyReports.filter(report => 
      report.year === currentYear && report.month === currentMonth && report.status === 'completed'
    ).length;
    const monthlyCompletion = expectedMonthlyReports > 0 ? (completedMonthlyReports / expectedMonthlyReports) * 100 : 0;

    // Care plan completion rate
    const carePlanCompletion = allClients.length > 0 ? (allCarePlans.length / allClients.length) * 100 : 0;

    return {
      weeklyCompletion: Math.round(weeklyCompletion * 100) / 100,
      monthlyCompletion: Math.round(monthlyCompletion * 100) / 100,
      carePlanCompletion: Math.round(carePlanCompletion * 100) / 100,
    };
  }

  // Helper methods
  private calculateWeeklyStats(weeklyDocs: WeeklyDocumentation[], year: number, week: number): WeeklyStats {
    const total = weeklyDocs.length;
    const completed = weeklyDocs.filter(doc => doc.approved).length;
    const pending = total - completed;
    const approved = weeklyDocs.filter(doc => doc.approved).length;
    const notApproved = total - approved;

    return {
      week,
      year,
      total,
      completed,
      pending,
      approved,
      notApproved,
    };
  }

  private calculateMonthlyStats(monthlyReports: MonthlyReport[], year: number, month: number): MonthlyStats {
    const total = monthlyReports.length;
    const notStarted = monthlyReports.filter(report => report.status === 'not_started').length;
    const inProgress = monthlyReports.filter(report => report.status === 'in_progress').length;
    const completed = monthlyReports.filter(report => report.status === 'completed').length;

    return {
      month,
      year,
      total,
      notStarted,
      inProgress,
      completed,
    };
  }

  private getQualityScore(assessment: string | null): number {
    if (!assessment || assessment === 'pending') return 0;
    
    const scoreMap: Record<string, number> = {
      'excellent': 5,
      'good': 4,
      'satisfactory': 3,
      'needs_improvement': 2,
      'poor': 1,
    };

    return scoreMap[assessment] || 0;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const firstSunday = new Date(firstDayOfYear);
    
    while (firstSunday.getDay() !== 0) {
      firstSunday.setDate(firstSunday.getDate() + 1);
    }
    
    const pastDaysOfYear = (date.getTime() - firstSunday.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + 1) / 7);
  }

  private getMonthName(month: number): string {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
      'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
    ];
    return months[month - 1];
  }
}

export const dashboardService = new DashboardService();