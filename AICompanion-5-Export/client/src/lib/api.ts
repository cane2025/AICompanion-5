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
  const token = localStorage.getItem("devToken");
  if (token) {
    headers["X-Dev-Token"] = token;
  }
  return headers;
}

// Staff API
export const getStaff = (): Promise<Staff[]> =>
  fetch(`${API_BASE_URL}/staff`, { credentials: "include" }).then((res) =>
    handleResponse<Staff[]>(res)
  );
export const createStaff = (data: InsertStaff): Promise<Staff> =>
  fetch(`${API_BASE_URL}/staff`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<Staff>(res));
export const updateStaff = (id: string, data: UpdateStaff): Promise<Staff> =>
  fetch(`${API_BASE_URL}/staff/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<Staff>(res));
export const deleteStaff = (id: string): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/staff/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then((res) => handleResponse<{ message: string }>(res));
export const restoreStaff = (id: string): Promise<Staff> =>
  fetch(`${API_BASE_URL}/staff/${id}/restore`, {
    method: "POST",
    credentials: "include",
  }).then((res) => handleResponse<Staff>(res));

// Client API
export const getClients = (): Promise<Client[]> =>
  fetch(`${API_BASE_URL}/clients/all`, { credentials: "include" }).then((res) =>
    handleResponse<Client[]>(res)
  );
export const createClient = (data: InsertClient): Promise<Client> =>
  fetch(`${API_BASE_URL}/clients`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<Client>(res));
export const updateClient = (id: string, data: UpdateClient): Promise<Client> =>
  fetch(`${API_BASE_URL}/clients/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<Client>(res));
export const deleteClient = (id: string): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/clients/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then((res) => handleResponse<{ message: string }>(res));
export const restoreClient = (id: string): Promise<Client> =>
  fetch(`${API_BASE_URL}/clients/${id}/restore`, {
    method: "POST",
    credentials: "include",
  }).then((res) => handleResponse<Client>(res));

// Auth API
export const login = async (data: LoginData): Promise<User> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("devToken");
  if (token) {
    headers["X-Dev-Token"] = token;
  }

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(data),
  });
  const json = await handleResponse<any>(res);
  if (json?.token) {
    try {
      localStorage.setItem("devToken", json.token as string);
    } catch {}
  }
  return json.user ?? json;
};

export const logout = (): Promise<void> =>
  fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).then((res) => handleResponse<void>(res));

export const checkAuth = (): Promise<User> =>
  fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" }).then((res) =>
    handleResponse<User>(res)
  );

// Care Plans API
export const getCarePlans = (): Promise<any[]> =>
  fetch(`${API_BASE_URL}/care-plans`, { credentials: "include" }).then((res) =>
    handleResponse<any[]>(res)
  );

export const getCarePlansByStaff = (staffId: string): Promise<any[]> =>
  fetch(`${API_BASE_URL}/care-plans/staff/${staffId}`, {
    credentials: "include",
  }).then((res) => handleResponse<any[]>(res));

export const getCarePlanByClient = (clientId: string): Promise<any> =>
  fetch(`${API_BASE_URL}/care-plans/${clientId}`, {
    credentials: "include",
  }).then((res) => handleResponse<any>(res));

export const createCarePlan = (data: any): Promise<any> =>
  fetch(`${API_BASE_URL}/care-plans`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

export const updateCarePlan = (id: string, data: any): Promise<any> =>
  fetch(`${API_BASE_URL}/care-plans/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

export const deleteCarePlan = (id: string): Promise<void> =>
  fetch(`${API_BASE_URL}/care-plans/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then((res) => handleResponse<void>(res));

// Implementation Plans API
export const getImplementationPlans = (): Promise<any[]> =>
  fetch(`${API_BASE_URL}/implementation-plans`, {
    credentials: "include",
  }).then((res) => handleResponse<any[]>(res));

export const getImplementationPlansByStaff = (
  staffId: string
): Promise<any[]> =>
  fetch(`${API_BASE_URL}/implementation-plans/staff/${staffId}`, {
    credentials: "include",
  }).then((res) => handleResponse<any[]>(res));

export const getImplementationPlanByClient = (clientId: string): Promise<any> =>
  fetch(`${API_BASE_URL}/implementation-plans/${clientId}`, {
    credentials: "include",
  }).then((res) => handleResponse<any>(res));

export const getImplementationPlanById = (id: string): Promise<any> =>
  fetch(`${API_BASE_URL}/implementation-plans/plan/${id}`, {
    credentials: "include",
  }).then((res) => handleResponse<any>(res));

export const createImplementationPlan = (data: any): Promise<any> =>
  fetch(`${API_BASE_URL}/implementation-plans`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

export const updateImplementationPlan = (id: string, data: any): Promise<any> =>
  fetch(`${API_BASE_URL}/implementation-plans/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

export const deleteImplementationPlan = (id: string): Promise<void> =>
  fetch(`${API_BASE_URL}/implementation-plans/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then((res) => handleResponse<void>(res));

// Weekly Documentation API
export const getWeeklyDocumentation = (): Promise<any[]> =>
  fetch(`${API_BASE_URL}/weekly-documentation`, {
    credentials: "include",
  }).then((res) => handleResponse<any[]>(res));

export const getWeeklyDocumentationByClient = (
  clientId: string
): Promise<any[]> =>
  fetch(`${API_BASE_URL}/weekly-documentation/${clientId}`, {
    credentials: "include",
  }).then((res) => handleResponse<any[]>(res));

export const createWeeklyDocumentation = (data: any): Promise<any> =>
  fetch(`${API_BASE_URL}/weekly-documentation`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

export const updateWeeklyDocumentation = (
  id: string,
  data: any
): Promise<any> =>
  fetch(`${API_BASE_URL}/weekly-documentation/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

export const deleteWeeklyDocumentation = (
  id: string
): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/weekly-documentation/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then((res) => handleResponse<{ message: string }>(res));

// Monthly Reports API
export const getMonthlyReports = (): Promise<any[]> =>
  fetch(`${API_BASE_URL}/monthly-reports`, { credentials: "include" }).then(
    (res) => handleResponse<any[]>(res)
  );

export const getMonthlyReportsByClient = (clientId: string): Promise<any[]> =>
  fetch(`${API_BASE_URL}/monthly-reports/${clientId}`, {
    credentials: "include",
  }).then((res) => handleResponse<any[]>(res));

export const getMonthlyReportById = (id: string): Promise<any> =>
  fetch(`${API_BASE_URL}/monthly-reports/${id}`, {
    credentials: "include",
  }).then((res) => handleResponse<any>(res));

export const createMonthlyReport = (data: any): Promise<any> =>
  fetch(`${API_BASE_URL}/monthly-reports`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

export const updateMonthlyReport = (id: string, data: any): Promise<any> =>
  fetch(`${API_BASE_URL}/monthly-reports/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

export const deleteMonthlyReport = (id: string): Promise<void> =>
  fetch(`${API_BASE_URL}/monthly-reports/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then((res) => handleResponse<void>(res));

// Vimsa Time API
export const getVimsaTime = (): Promise<any[]> =>
  fetch(`${API_BASE_URL}/vimsa-time`, { credentials: "include" }).then((res) =>
    handleResponse<any[]>(res)
  );

export const getVimsaTimeByClient = (clientId: string): Promise<any[]> =>
  fetch(`${API_BASE_URL}/vimsa-time/${clientId}`, {
    credentials: "include",
  }).then((res) => handleResponse<any[]>(res));

export const getVimsaTimeById = (id: string): Promise<any> =>
  fetch(`${API_BASE_URL}/vimsa-time/${id}`, {
    credentials: "include",
  }).then((res) => handleResponse<any>(res));

export const createVimsaTime = (data: any): Promise<any> =>
  fetch(`${API_BASE_URL}/vimsa-time`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

export const updateVimsaTime = (id: string, data: any): Promise<any> =>
  fetch(`${API_BASE_URL}/vimsa-time/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

export const deleteVimsaTime = (id: string): Promise<void> =>
  fetch(`${API_BASE_URL}/vimsa-time/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then((res) => handleResponse<void>(res));

// Staff-specific client endpoints
export const getClientsByStaff = (staffId: string): Promise<Client[]> =>
  fetch(`${API_BASE_URL}/staff/${staffId}/clients`, {
    credentials: "include",
  }).then((res) => handleResponse<Client[]>(res));

// New buildPayload function to construct payloads for API calls
function buildPayload(input: any) {
  return {
    quality: input.qualityScore ?? "",
    reportContent: input.activities ?? "",
    comments: input.notes ?? "",
    week: input.week,
    month: input.month,
    year: input.year,
    staffId: input.staffId,
    clientId: input.clientId,
  };
}
