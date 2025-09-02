import { Router } from "express";
import { DashboardService } from "../services/dashboard.js";
import { requireAuth, requireRoles } from "../middleware/auth.js";

export const dashboardRoutes = Router();

// Apply authentication to all dashboard routes
dashboardRoutes.use(requireAuth);

// Get complete dashboard data
dashboardRoutes.get("/stats", async (req, res) => {
  try {
    const { staffId } = req.query;
    const user = (req as any).user;
    
    // If user is staff (not admin), only show their own data
    const targetStaffId = user.role === 'staff' ? user.id : (staffId as string);
    
    const dashboardData = await DashboardService.getCompleteDashboardData(targetStaffId);
    
    return res.json(dashboardData);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av dashboard-statistik" });
  }
});

// Get overview statistics
dashboardRoutes.get("/overview", async (req, res) => {
  try {
    const overview = await DashboardService.getOverviewStats();
    return res.json(overview);
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av översikt" });
  }
});

// Get trend data
dashboardRoutes.get("/trends", async (req, res) => {
  try {
    const trends = await DashboardService.getTrendData();
    return res.json(trends);
  } catch (error) {
    console.error("Dashboard trends error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av trenddata" });
  }
});

// Get quality metrics
dashboardRoutes.get("/quality", async (req, res) => {
  try {
    const quality = await DashboardService.getQualityData();
    return res.json(quality);
  } catch (error) {
    console.error("Dashboard quality error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av kvalitetsdata" });
  }
});

// Get alerts and notifications
dashboardRoutes.get("/alerts", async (req, res) => {
  try {
    const alerts = await DashboardService.getAlerts();
    return res.json(alerts);
  } catch (error) {
    console.error("Dashboard alerts error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av varningar" });
  }
});

// Get staff performance data
dashboardRoutes.get("/staff-performance", requireRoles(['admin', 'staff']), async (req, res) => {
  try {
    const { staffId } = req.query;
    const user = (req as any).user;
    
    // Staff can only see their own performance, admins can see all
    const targetStaffId = user.role === 'staff' ? user.id : (staffId as string);
    
    const performanceData = await DashboardService.getStaffPerformanceData(targetStaffId);
    
    return res.json(performanceData);
  } catch (error) {
    console.error("Staff performance error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av personalstatistik" });
  }
});

// Get client status distribution
dashboardRoutes.get("/client-distribution", async (req, res) => {
  try {
    const distribution = await DashboardService.getClientStatusDistribution();
    return res.json(distribution);
  } catch (error) {
    console.error("Client distribution error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av klientfördelning" });
  }
});

// Get workload analysis
dashboardRoutes.get("/workload", requireRoles(['admin']), async (req, res) => {
  try {
    const workload = await DashboardService.getWorkloadAnalysis();
    return res.json(workload);
  } catch (error) {
    console.error("Workload analysis error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av arbetsbelastningsanalys" });
  }
});

// Get monthly trends with custom period
dashboardRoutes.get("/trends/:months", async (req, res) => {
  try {
    const { months } = req.params;
    const monthsNum = parseInt(months);
    
    if (isNaN(monthsNum) || monthsNum < 1 || monthsNum > 24) {
      return res.status(400).json({ error: "Ogiltig tidsperiod (1-24 månader)" });
    }
    
    const trends = await DashboardService.getMonthlyTrends(monthsNum);
    return res.json(trends);
  } catch (error) {
    console.error("Custom trends error:", error);
    return res.status(500).json({ error: "Fel vid hämtning av anpassade trender" });
  }
});

export default dashboardRoutes;