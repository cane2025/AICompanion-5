import { Router } from "express";
import { dbStorage } from "../dbStorage.js";
import { sql } from "drizzle-orm";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks } from "date-fns";
import { sv } from "date-fns/locale";

export const dashboardRouter = Router();

// Middleware for authentication
function requireAuth(req: any, res: any, next: any) {
  const token = req.cookies?.authToken || req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret") as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Get overall system statistics
dashboardRouter.get("/statistics/overview", requireAuth, async (_req, res) => {
  try {
    const stats = await dbStorage.getStatistics();
    
    // Get additional statistics
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Count documents for current period
    const allWeeklyDocs = await dbStorage.getAllWeeklyDocumentation();
    const currentWeekDocs = allWeeklyDocs.filter(
      d => d.year === currentYear && d.week === currentWeek
    );
    const approvedCurrentWeek = currentWeekDocs.filter(d => d.approved).length;

    const allMonthlyReports = await dbStorage.getAllMonthlyReports();
    const currentMonthReports = allMonthlyReports.filter(
      r => r.year === currentYear && r.month === currentMonth
    );
    const completedCurrentMonth = currentMonthReports.filter(
      r => r.status === "completed"
    ).length;

    res.json({
      ...stats,
      currentWeek: {
        week: currentWeek,
        year: currentYear,
        totalDocumentations: currentWeekDocs.length,
        approved: approvedCurrentWeek,
        pending: currentWeekDocs.length - approvedCurrentWeek,
      },
      currentMonth: {
        month: format(now, "MMMM", { locale: sv }),
        year: currentYear,
        totalReports: currentMonthReports.length,
        completed: completedCurrentMonth,
        inProgress: currentMonthReports.filter(r => r.status === "in_progress").length,
        notStarted: currentMonthReports.filter(r => r.status === "not_started").length,
      },
    });
  } catch (error) {
    console.error("Dashboard statistics error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Get documentation completion rates over time
dashboardRouter.get("/statistics/documentation-trends", requireAuth, async (req, res) => {
  try {
    const weeks = parseInt(req.query.weeks as string) || 12;
    const endDate = new Date();
    const startDate = subWeeks(endDate, weeks);

    const allDocs = await dbStorage.getAllWeeklyDocumentation();
    
    // Group by week
    const weeklyStats: Array<{
      week: number;
      year: number;
      total: number;
      approved: number;
      completionRate: number;
    }> = [];

    for (let i = 0; i < weeks; i++) {
      const weekDate = subWeeks(endDate, i);
      const week = getWeekNumber(weekDate);
      const year = weekDate.getFullYear();

      const weekDocs = allDocs.filter(d => d.year === year && d.week === week);
      const approved = weekDocs.filter(d => d.approved).length;
      
      weeklyStats.unshift({
        week,
        year,
        total: weekDocs.length,
        approved,
        completionRate: weekDocs.length > 0 ? (approved / weekDocs.length) * 100 : 0,
      });
    }

    res.json({
      period: {
        start: format(startDate, "yyyy-MM-dd"),
        end: format(endDate, "yyyy-MM-dd"),
        weeks,
      },
      data: weeklyStats,
    });
  } catch (error) {
    console.error("Documentation trends error:", error);
    res.status(500).json({ error: "Failed to fetch documentation trends" });
  }
});

// Get monthly report statistics
dashboardRouter.get("/statistics/monthly-reports", requireAuth, async (req, res) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const endDate = new Date();
    const startDate = subMonths(endDate, months);

    const allReports = await dbStorage.getAllMonthlyReports();
    
    // Group by month
    const monthlyStats: Array<{
      month: number;
      year: number;
      monthName: string;
      total: number;
      completed: number;
      inProgress: number;
      notStarted: number;
      quality: {
        excellent: number;
        good: number;
        needsImprovement: number;
        pending: number;
      };
    }> = [];

    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(endDate, i);
      const month = monthDate.getMonth() + 1;
      const year = monthDate.getFullYear();

      const monthReports = allReports.filter(r => r.year === year && r.month === month);
      
      monthlyStats.unshift({
        month,
        year,
        monthName: format(monthDate, "MMMM", { locale: sv }),
        total: monthReports.length,
        completed: monthReports.filter(r => r.status === "completed").length,
        inProgress: monthReports.filter(r => r.status === "in_progress").length,
        notStarted: monthReports.filter(r => r.status === "not_started").length,
        quality: {
          excellent: monthReports.filter(r => r.quality === "excellent").length,
          good: monthReports.filter(r => r.quality === "good").length,
          needsImprovement: monthReports.filter(r => r.quality === "needs_improvement").length,
          pending: monthReports.filter(r => !r.quality || r.quality === "pending").length,
        },
      });
    }

    res.json({
      period: {
        start: format(startDate, "yyyy-MM-dd"),
        end: format(endDate, "yyyy-MM-dd"),
        months,
      },
      data: monthlyStats,
    });
  } catch (error) {
    console.error("Monthly reports statistics error:", error);
    res.status(500).json({ error: "Failed to fetch monthly report statistics" });
  }
});

// Get staff workload statistics
dashboardRouter.get("/statistics/staff-workload", requireAuth, async (_req, res) => {
  try {
    const allStaff = await dbStorage.getAllStaff();
    const currentWeek = getWeekNumber(new Date());
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const workloadStats = await Promise.all(
      allStaff.map(async (staffMember) => {
        const clients = await dbStorage.getClientsByStaffId(staffMember.id!);
        const activeClients = clients.filter(c => c.status === "active");
        
        // Get weekly documentation status
        const weeklyDocs = await dbStorage.getWeeklyDocumentationByStaff(staffMember.id!);
        const currentWeekDocs = weeklyDocs.filter(
          d => d.year === currentYear && d.week === currentWeek
        );
        const approvedThisWeek = currentWeekDocs.filter(d => d.approved).length;

        // Get monthly reports status
        const monthlyReports = await dbStorage.getMonthlyReportsByStaff(staffMember.id!);
        const currentMonthReports = monthlyReports.filter(
          r => r.year === currentYear && r.month === currentMonth
        );
        const completedThisMonth = currentMonthReports.filter(
          r => r.status === "completed"
        ).length;

        // Get care plans
        const carePlans = await dbStorage.getCarePlansByStaff(staffMember.id!);
        const activeCarePlans = carePlans.filter(p => p.isActive);

        return {
          staffId: staffMember.id,
          staffName: staffMember.name,
          staffInitials: staffMember.initials,
          activeClients: activeClients.length,
          totalClients: clients.length,
          currentWeek: {
            expected: activeClients.length,
            completed: approvedThisWeek,
            pending: activeClients.length - approvedThisWeek,
          },
          currentMonth: {
            expected: activeClients.length,
            completed: completedThisMonth,
            inProgress: currentMonthReports.filter(r => r.status === "in_progress").length,
            notStarted: activeClients.length - currentMonthReports.length,
          },
          activeCarePlans: activeCarePlans.length,
        };
      })
    );

    res.json({
      timestamp: new Date().toISOString(),
      week: currentWeek,
      year: currentYear,
      month: format(new Date(), "MMMM", { locale: sv }),
      workload: workloadStats,
    });
  } catch (error) {
    console.error("Staff workload statistics error:", error);
    res.status(500).json({ error: "Failed to fetch staff workload statistics" });
  }
});

// Get client activity statistics
dashboardRouter.get("/statistics/client-activity", requireAuth, async (_req, res) => {
  try {
    const allClients = await dbStorage.getAllClients();
    
    const clientStats = await Promise.all(
      allClients.map(async (client) => {
        const [weeklyDocs, monthlyReports, carePlans] = await Promise.all([
          dbStorage.getWeeklyDocumentationByClient(client.id!),
          dbStorage.getMonthlyReportsByClient(client.id!),
          dbStorage.getCarePlansByClient(client.id!),
        ]);

        const lastWeeklyDoc = weeklyDocs[0]; // Already sorted by date
        const lastMonthlyReport = monthlyReports[0];
        const activeCarePlan = carePlans.find(p => p.isActive);

        return {
          clientId: client.id,
          clientInitials: client.initials,
          status: client.status,
          staffId: client.staffId,
          lastActivity: {
            weeklyDocumentation: lastWeeklyDoc
              ? {
                  week: lastWeeklyDoc.week,
                  year: lastWeeklyDoc.year,
                  approved: lastWeeklyDoc.approved,
                  date: lastWeeklyDoc.createdAt,
                }
              : null,
            monthlyReport: lastMonthlyReport
              ? {
                  month: lastMonthlyReport.month,
                  year: lastMonthlyReport.year,
                  status: lastMonthlyReport.status,
                  date: lastMonthlyReport.createdAt,
                }
              : null,
            carePlan: activeCarePlan
              ? {
                  id: activeCarePlan.id,
                  status: activeCarePlan.status,
                  createdAt: activeCarePlan.createdAt,
                }
              : null,
          },
          statistics: {
            totalWeeklyDocs: weeklyDocs.length,
            approvedWeeklyDocs: weeklyDocs.filter(d => d.approved).length,
            totalMonthlyReports: monthlyReports.length,
            completedMonthlyReports: monthlyReports.filter(r => r.status === "completed").length,
            totalCarePlans: carePlans.length,
            activeCarePlans: carePlans.filter(p => p.isActive).length,
          },
        };
      })
    );

    // Calculate summary statistics
    const activeClients = clientStats.filter(c => c.status === "active").length;
    const inactiveClients = clientStats.filter(c => c.status !== "active").length;
    
    res.json({
      timestamp: new Date().toISOString(),
      summary: {
        total: allClients.length,
        active: activeClients,
        inactive: inactiveClients,
      },
      clients: clientStats,
    });
  } catch (error) {
    console.error("Client activity statistics error:", error);
    res.status(500).json({ error: "Failed to fetch client activity statistics" });
  }
});

// Get quality metrics
dashboardRouter.get("/statistics/quality-metrics", requireAuth, async (_req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all recent documents and reports
    const [allWeeklyDocs, allMonthlyReports] = await Promise.all([
      dbStorage.getAllWeeklyDocumentation(),
      dbStorage.getAllMonthlyReports(),
    ]);

    // Filter recent documents
    const recentWeeklyDocs = allWeeklyDocs.filter(
      d => new Date(d.createdAt!) >= thirtyDaysAgo
    );
    const recentMonthlyReports = allMonthlyReports.filter(
      r => new Date(r.createdAt!) >= thirtyDaysAgo
    );

    // Calculate quality metrics
    const weeklyDocQuality = {
      total: recentWeeklyDocs.length,
      excellent: recentWeeklyDocs.filter(d => d.qualityAssessment === "excellent").length,
      good: recentWeeklyDocs.filter(d => d.qualityAssessment === "good").length,
      needsImprovement: recentWeeklyDocs.filter(d => d.qualityAssessment === "needs_improvement").length,
      pending: recentWeeklyDocs.filter(d => !d.qualityAssessment || d.qualityAssessment === "pending").length,
      approvalRate: recentWeeklyDocs.length > 0
        ? (recentWeeklyDocs.filter(d => d.approved).length / recentWeeklyDocs.length) * 100
        : 0,
    };

    const monthlyReportQuality = {
      total: recentMonthlyReports.length,
      excellent: recentMonthlyReports.filter(r => r.quality === "excellent").length,
      good: recentMonthlyReports.filter(r => r.quality === "good").length,
      needsImprovement: recentMonthlyReports.filter(r => r.quality === "needs_improvement").length,
      pending: recentMonthlyReports.filter(r => !r.quality || r.quality === "pending").length,
      completionRate: recentMonthlyReports.length > 0
        ? (recentMonthlyReports.filter(r => r.status === "completed").length / recentMonthlyReports.length) * 100
        : 0,
    };

    // Calculate timeliness metrics
    const timeliness = {
      weeklyDocumentation: {
        onTime: recentWeeklyDocs.filter(d => {
          // Check if documented within the same week
          const docDate = new Date(d.createdAt!);
          const docWeek = getWeekNumber(docDate);
          return docWeek === d.week;
        }).length,
        late: recentWeeklyDocs.filter(d => {
          const docDate = new Date(d.createdAt!);
          const docWeek = getWeekNumber(docDate);
          return docWeek > d.week;
        }).length,
      },
      monthlyReports: {
        onTime: recentMonthlyReports.filter(r => {
          // Check if submitted before month end
          if (!r.submissionDate) return false;
          const submissionDate = new Date(r.submissionDate);
          const monthEnd = endOfMonth(new Date(r.year, r.month - 1));
          return submissionDate <= monthEnd;
        }).length,
        late: recentMonthlyReports.filter(r => {
          if (!r.submissionDate) return true;
          const submissionDate = new Date(r.submissionDate);
          const monthEnd = endOfMonth(new Date(r.year, r.month - 1));
          return submissionDate > monthEnd;
        }).length,
      },
    };

    res.json({
      period: {
        start: format(thirtyDaysAgo, "yyyy-MM-dd"),
        end: format(now, "yyyy-MM-dd"),
        days: 30,
      },
      weeklyDocumentation: weeklyDocQuality,
      monthlyReports: monthlyReportQuality,
      timeliness,
      overallScore: calculateOverallQualityScore(weeklyDocQuality, monthlyReportQuality, timeliness),
    });
  } catch (error) {
    console.error("Quality metrics error:", error);
    res.status(500).json({ error: "Failed to fetch quality metrics" });
  }
});

// Get upcoming deadlines
dashboardRouter.get("/statistics/upcoming-deadlines", requireAuth, async (_req, res) => {
  try {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    const allClients = await dbStorage.getAllClients();
    const activeClients = allClients.filter(c => c.status === "active");

    const deadlines = {
      weeklyDocumentation: [],
      monthlyReports: [],
      carePlans: [],
    };

    // Check weekly documentation deadlines
    for (const client of activeClients) {
      const doc = await dbStorage.getWeeklyDocumentationByWeek(
        client.id!,
        currentYear,
        currentWeek
      );

      if (!doc || !doc.approved) {
        const staff = await dbStorage.getStaff(client.staffId);
        deadlines.weeklyDocumentation.push({
          clientId: client.id,
          clientInitials: client.initials,
          staffId: client.staffId,
          staffName: staff?.name || "Unknown",
          week: currentWeek,
          year: currentYear,
          deadline: endOfWeek(now, { weekStartsOn: 1 }),
          status: doc ? "pending_approval" : "not_started",
        });
      }
    }

    // Check monthly report deadlines
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysRemaining = daysInMonth - now.getDate();

    if (daysRemaining <= 7) {
      for (const client of activeClients) {
        const report = await dbStorage.getMonthlyReportByMonth(
          client.id!,
          currentYear,
          currentMonth
        );

        if (!report || report.status !== "completed") {
          const staff = await dbStorage.getStaff(client.staffId);
          deadlines.monthlyReports.push({
            clientId: client.id,
            clientInitials: client.initials,
            staffId: client.staffId,
            staffName: staff?.name || "Unknown",
            month: currentMonth,
            monthName: format(now, "MMMM", { locale: sv }),
            year: currentYear,
            deadline: endOfMonth(now),
            status: report?.status || "not_started",
            daysRemaining,
          });
        }
      }
    }

    // Check care plan follow-ups
    const carePlans = await dbStorage.getAllCarePlans();
    const activePlans = carePlans.filter(p => p.isActive);

    for (const plan of activePlans) {
      const planDate = new Date(plan.createdAt!);
      const daysSince = Math.floor((now.getTime() - planDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince >= 25 && daysSince <= 35) {
        const client = await dbStorage.getClient(plan.clientId);
        const staff = await dbStorage.getStaff(plan.staffId);
        
        deadlines.carePlans.push({
          planId: plan.id,
          clientId: plan.clientId,
          clientInitials: client?.initials || "Unknown",
          staffId: plan.staffId,
          staffName: staff?.name || "Unknown",
          createdAt: plan.createdAt,
          daysSince,
          followUpDue: daysSince >= 30,
          status: plan.status,
        });
      }
    }

    res.json({
      timestamp: now.toISOString(),
      currentWeek,
      currentMonth: format(now, "MMMM", { locale: sv }),
      currentYear,
      deadlines,
      summary: {
        weeklyDocumentationPending: deadlines.weeklyDocumentation.length,
        monthlyReportsPending: deadlines.monthlyReports.length,
        carePlansNeedingFollowUp: deadlines.carePlans.filter(p => p.followUpDue).length,
      },
    });
  } catch (error) {
    console.error("Upcoming deadlines error:", error);
    res.status(500).json({ error: "Failed to fetch upcoming deadlines" });
  }
});

// Helper functions
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function calculateOverallQualityScore(
  weeklyQuality: any,
  monthlyQuality: any,
  timeliness: any
): number {
  // Calculate weighted score based on quality and timeliness
  const weeklyScore = 
    (weeklyQuality.excellent * 100 + 
     weeklyQuality.good * 80 + 
     weeklyQuality.needsImprovement * 50) / 
    (weeklyQuality.total || 1);

  const monthlyScore = 
    (monthlyQuality.excellent * 100 + 
     monthlyQuality.good * 80 + 
     monthlyQuality.needsImprovement * 50) / 
    (monthlyQuality.total || 1);

  const timelinessScore = 
    ((timeliness.weeklyDocumentation.onTime / 
      (timeliness.weeklyDocumentation.onTime + timeliness.weeklyDocumentation.late || 1)) * 100 +
     (timeliness.monthlyReports.onTime / 
      (timeliness.monthlyReports.onTime + timeliness.monthlyReports.late || 1)) * 100) / 2;

  // Weighted average: 40% weekly, 40% monthly, 20% timeliness
  return Math.round(weeklyScore * 0.4 + monthlyScore * 0.4 + timelinessScore * 0.2);
}