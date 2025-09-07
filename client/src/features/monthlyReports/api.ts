import * as api from "@/lib/api";

export const getMonthlyReports = () => api.getMonthlyReports();
export const getMonthlyReportsByClient = (clientId: string) => api.getMonthlyReportsByClient(clientId);
export const createMonthlyReport = (data: any) => api.createMonthlyReport(data);
export const getMonthlyReportById = (id: string) => api.getMonthlyReportById(id);
export const updateMonthlyReport = (id: string, data: any) => api.updateMonthlyReport(id, data);
export const deleteMonthlyReport = (id: string) => api.deleteMonthlyReport(id);