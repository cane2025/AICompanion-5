import { z } from "zod";
import {
  InsertClient,
  InsertStaff,
  UpdateClient,
  UpdateStaff,
  loginSchema,
  type User,
  type Staff,
  type Client,
} from "@shared/schema";

const API_BASE_URL = "/api";

export type LoginData = z.infer<typeof loginSchema>;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || "Ett okänt fel uppstod");
  }
  if (response.status === 204) return {} as T;
  return response.json();
}

// Helper function to get auth headers
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("authToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// === ENHANCED AUTHENTICATION ===
export const loginEnhanced = async (data: LoginData): Promise<User> => {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  
  const json = await handleResponse<any>(res);
  
  if (json?.token) {
    try {
      localStorage.setItem("authToken", json.token);
    } catch {}
  }
  
  return json.user ?? json;
};

export const logoutEnhanced = (): Promise<void> =>
  fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).then((res) => {
    localStorage.removeItem("authToken");
    return handleResponse<void>(res);
  });

export const checkAuthEnhanced = (): Promise<User> =>
  fetch(`${API_BASE_URL}/auth/me`, { 
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<User>(res));

// === ENHANCED STAFF API WITH SEARCH ===
export const getStaffEnhanced = (params?: {
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}): Promise<Staff[]> => {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append('search', params.search);
  if (params?.sort) searchParams.append('sort', params.sort);
  if (params?.order) searchParams.append('order', params.order);
  
  return fetch(`${API_BASE_URL}/staff?${searchParams}`, { 
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<Staff[]>(res));
};

export const createStaffEnhanced = (data: InsertStaff): Promise<Staff> =>
  fetch(`${API_BASE_URL}/staff`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<Staff>(res));

export const updateStaffEnhanced = (id: string, data: UpdateStaff): Promise<Staff> =>
  fetch(`${API_BASE_URL}/staff/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<Staff>(res));

export const deleteStaffEnhanced = (id: string): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/staff/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
    credentials: "include",
  }).then((res) => handleResponse<{ message: string }>(res));

export const restoreStaffEnhanced = (id: string): Promise<Staff> =>
  fetch(`${API_BASE_URL}/staff/${id}/restore`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
  }).then((res) => handleResponse<Staff>(res));

// === ENHANCED CLIENT API WITH SEARCH AND FILTERING ===
export const getClientsEnhanced = (params?: {
  search?: string;
  staffId?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}): Promise<Client[]> => {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append('search', params.search);
  if (params?.staffId) searchParams.append('staffId', params.staffId);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.sort) searchParams.append('sort', params.sort);
  if (params?.order) searchParams.append('order', params.order);
  
  return fetch(`${API_BASE_URL}/clients/all?${searchParams}`, { 
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<Client[]>(res));
};

export const getClientsByStaffEnhanced = (staffId: string, params?: {
  search?: string;
  status?: string;
}): Promise<Client[]> => {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.append('search', params.search);
  if (params?.status) searchParams.append('status', params.status);
  
  return fetch(`${API_BASE_URL}/staff/${staffId}/clients?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<Client[]>(res));
};

// === BULK OPERATIONS ===
export const bulkDeleteClients = (clientIds: string[]): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/bulk/clients`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ action: "delete", clientIds }),
  }).then((res) => handleResponse<{ message: string }>(res));

export const bulkUpdateClients = (clientIds: string[], updates: Partial<UpdateClient>): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/bulk/clients`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ action: "update", clientIds, updates }),
  }).then((res) => handleResponse<{ message: string }>(res));

export const bulkDeleteStaff = (staffIds: string[]): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/bulk/staff`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ action: "delete", staffIds }),
  }).then((res) => handleResponse<{ message: string }>(res));

export const bulkUpdateStaff = (staffIds: string[], updates: Partial<UpdateStaff>): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/bulk/staff`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ action: "update", staffIds, updates }),
  }).then((res) => handleResponse<{ message: string }>(res));

// === PDF GENERATION ===
export const downloadMonthlyReportPDF = async (reportId: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/advanced/pdf/monthly-report/${reportId}`, {
    credentials: "include",
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error("Fel vid PDF-generering");
  }
  
  return response.blob();
};

export const downloadWeeklyDocumentationPDF = async (docId: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/advanced/pdf/weekly-documentation/${docId}`, {
    credentials: "include",
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error("Fel vid PDF-generering");
  }
  
  return response.blob();
};

export const downloadCarePlanPDF = async (planId: string): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/advanced/pdf/care-plan/${planId}`, {
    credentials: "include",
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error("Fel vid PDF-generering");
  }
  
  return response.blob();
};

export const downloadBulkReportsPDF = async (reportIds: string[], reportType: 'monthly' | 'weekly'): Promise<Blob> => {
  const response = await fetch(`${API_BASE_URL}/advanced/pdf/bulk`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ reportIds, reportType }),
  });
  
  if (!response.ok) {
    throw new Error("Fel vid bulk PDF-generering");
  }
  
  return response.blob();
};

// === EMAIL NOTIFICATIONS ===
export const sendCarePlanNotification = (carePlanId: string, message?: string): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/advanced/notifications/care-plan`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ carePlanId, message }),
  }).then((res) => handleResponse<{ message: string }>(res));

export const sendMonthlyReportReminders = (year: number, month: number): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/advanced/notifications/monthly-report-reminder`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ year, month }),
  }).then((res) => handleResponse<{ message: string }>(res));

// === CALENDAR INTEGRATION ===
export const getCalendarEvents = (params?: {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  type?: string;
}): Promise<any[]> => {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.append('startDate', params.startDate);
  if (params?.endDate) searchParams.append('endDate', params.endDate);
  if (params?.staffId) searchParams.append('staffId', params.staffId);
  if (params?.type) searchParams.append('type', params.type);
  
  return fetch(`${API_BASE_URL}/advanced/calendar/events?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any[]>(res));
};

export const getMonthlyCalendar = (year: number, month: number, staffId?: string): Promise<any> => {
  const searchParams = new URLSearchParams();
  if (staffId) searchParams.append('staffId', staffId);
  
  return fetch(`${API_BASE_URL}/advanced/calendar/month/${year}/${month}?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any>(res));
};

export const getUpcomingEvents = (days?: number, staffId?: string): Promise<any[]> => {
  const searchParams = new URLSearchParams();
  if (days) searchParams.append('days', days.toString());
  if (staffId) searchParams.append('staffId', staffId);
  
  return fetch(`${API_BASE_URL}/advanced/calendar/upcoming?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any[]>(res));
};

export const getOverdueEvents = (staffId?: string): Promise<any[]> => {
  const searchParams = new URLSearchParams();
  if (staffId) searchParams.append('staffId', staffId);
  
  return fetch(`${API_BASE_URL}/advanced/calendar/overdue?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any[]>(res));
};

export const exportCalendar = async (params?: {
  startDate?: string;
  endDate?: string;
  staffId?: string;
}): Promise<Blob> => {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.append('startDate', params.startDate);
  if (params?.endDate) searchParams.append('endDate', params.endDate);
  if (params?.staffId) searchParams.append('staffId', params.staffId);
  
  const response = await fetch(`${API_BASE_URL}/advanced/calendar/export?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error("Fel vid kalenderexport");
  }
  
  return response.blob();
};

// === DATA EXPORT/IMPORT ===
export const exportData = async (type: string, format: 'json' | 'csv' = 'json'): Promise<Blob> => {
  const searchParams = new URLSearchParams();
  searchParams.append('type', type);
  searchParams.append('format', format);
  
  const response = await fetch(`${API_BASE_URL}/advanced/export/data?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    throw new Error("Fel vid dataexport");
  }
  
  return response.blob();
};

export const importData = (data: any, type: string, overwrite: boolean = false): Promise<{ message: string; count: number }> =>
  fetch(`${API_BASE_URL}/advanced/import/data`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify({ data, type, overwrite }),
  }).then((res) => handleResponse<{ message: string; count: number }>(res));

// === DASHBOARD STATISTICS ===
export const getDashboardStats = (staffId?: string): Promise<any> => {
  const searchParams = new URLSearchParams();
  if (staffId) searchParams.append('staffId', staffId);
  
  return fetch(`${API_BASE_URL}/dashboard/stats?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any>(res));
};

export const getDashboardOverview = (): Promise<any> =>
  fetch(`${API_BASE_URL}/dashboard/overview`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any>(res));

export const getDashboardTrends = (): Promise<any> =>
  fetch(`${API_BASE_URL}/dashboard/trends`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any>(res));

export const getDashboardQuality = (): Promise<any> =>
  fetch(`${API_BASE_URL}/dashboard/quality`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any>(res));

export const getDashboardAlerts = (): Promise<any> =>
  fetch(`${API_BASE_URL}/dashboard/alerts`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any>(res));

export const getStaffPerformance = (staffId?: string): Promise<any> => {
  const searchParams = new URLSearchParams();
  if (staffId) searchParams.append('staffId', staffId);
  
  return fetch(`${API_BASE_URL}/dashboard/staff-performance?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any>(res));
};

export const getClientDistribution = (): Promise<any> =>
  fetch(`${API_BASE_URL}/dashboard/client-distribution`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any>(res));

export const getWorkloadAnalysis = (): Promise<any> =>
  fetch(`${API_BASE_URL}/dashboard/workload`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any>(res));

// === ENHANCED SEARCH API ===
export const searchAll = (query: string): Promise<{
  clients: Client[];
  staff: Staff[];
  carePlans: any[];
  monthlyReports: any[];
  weeklyDocumentation: any[];
}> => {
  return fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any>(res));
};

// === CARE PLANS WITH ENHANCED FEATURES ===
export const getCarePlansEnhanced = (params?: {
  clientId?: string;
  staffId?: string;
  status?: string;
  search?: string;
}): Promise<any[]> => {
  const searchParams = new URLSearchParams();
  if (params?.clientId) searchParams.append('clientId', params.clientId);
  if (params?.staffId) searchParams.append('staffId', params.staffId);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.search) searchParams.append('search', params.search);
  
  return fetch(`${API_BASE_URL}/care-plans?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any[]>(res));
};

export const getCarePlanEnhanced = (id: string): Promise<any> =>
  fetch(`${API_BASE_URL}/care-plans/${id}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any>(res));

export const createCarePlanEnhanced = (data: any): Promise<any> =>
  fetch(`${API_BASE_URL}/care-plans`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

export const updateCarePlanEnhanced = (id: string, data: any): Promise<any> =>
  fetch(`${API_BASE_URL}/care-plans/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

// === IMPLEMENTATION PLANS WITH ENHANCED FEATURES ===
export const getImplementationPlansEnhanced = (params?: {
  clientId?: string;
  staffId?: string;
  status?: string;
  search?: string;
}): Promise<any[]> => {
  const searchParams = new URLSearchParams();
  if (params?.clientId) searchParams.append('clientId', params.clientId);
  if (params?.staffId) searchParams.append('staffId', params.staffId);
  if (params?.status) searchParams.append('status', params.status);
  if (params?.search) searchParams.append('search', params.search);
  
  return fetch(`${API_BASE_URL}/implementation-plans?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any[]>(res));
};

// === WEEKLY DOCUMENTATION WITH ENHANCED FEATURES ===
export const getWeeklyDocumentationEnhanced = (params?: {
  clientId?: string;
  staffId?: string;
  year?: number;
  week?: number;
  search?: string;
}): Promise<any[]> => {
  const searchParams = new URLSearchParams();
  if (params?.clientId) searchParams.append('clientId', params.clientId);
  if (params?.staffId) searchParams.append('staffId', params.staffId);
  if (params?.year) searchParams.append('year', params.year.toString());
  if (params?.week) searchParams.append('week', params.week.toString());
  if (params?.search) searchParams.append('search', params.search);
  
  return fetch(`${API_BASE_URL}/weekly-documentation?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any[]>(res));
};

// === MONTHLY REPORTS WITH ENHANCED FEATURES ===
export const getMonthlyReportsEnhanced = (params?: {
  clientId?: string;
  staffId?: string;
  year?: number;
  month?: number;
  status?: string;
  search?: string;
}): Promise<any[]> => {
  const searchParams = new URLSearchParams();
  if (params?.clientId) searchParams.append('clientId', params.clientId);
  if (params?.staffId) searchParams.append('staffId', params.staffId);
  if (params?.year) searchParams.append('year', params.year.toString());
  if (params?.month) searchParams.append('month', params.month.toString());
  if (params?.status) searchParams.append('status', params.status);
  if (params?.search) searchParams.append('search', params.search);
  
  return fetch(`${API_BASE_URL}/monthly-reports?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any[]>(res));
};

// === VIMSA TIME WITH ENHANCED FEATURES ===
export const getVimsaTimeEnhanced = (params?: {
  clientId?: string;
  staffId?: string;
  year?: number;
  week?: number;
  approved?: boolean;
}): Promise<any[]> => {
  const searchParams = new URLSearchParams();
  if (params?.clientId) searchParams.append('clientId', params.clientId);
  if (params?.staffId) searchParams.append('staffId', params.staffId);
  if (params?.year) searchParams.append('year', params.year.toString());
  if (params?.week) searchParams.append('week', params.week.toString());
  if (params?.approved !== undefined) searchParams.append('approved', params.approved.toString());
  
  return fetch(`${API_BASE_URL}/vimsa-time?${searchParams}`, {
    credentials: "include",
    headers: getAuthHeaders()
  }).then((res) => handleResponse<any[]>(res));
};

// === UTILITY FUNCTIONS ===
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const readFileAsJSON = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        resolve(json);
      } catch (error) {
        reject(new Error('Ogiltig JSON-fil'));
      }
    };
    reader.onerror = () => reject(new Error('Fel vid läsning av fil'));
    reader.readAsText(file);
  });
};
