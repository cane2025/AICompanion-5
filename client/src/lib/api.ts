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
  type GfpCreate,
  type GfpUpdate,
  type GfpLock,
} from "@shared/schema";

const API_BASE_URL = "/api";

export type LoginData = z.infer<typeof loginSchema>;

// Enhanced error class for better error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError() {
    return this.status === 0 || !navigator.onLine;
  }

  get isServerError() {
    return this.status >= 500;
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  get isRetryable() {
    // Retry on network errors, server errors, but not client errors (except 408, 429)
    return this.isNetworkError || 
           this.isServerError || 
           this.status === 408 || // Request Timeout
           this.status === 429;   // Too Many Requests
  }
}

async function handleResponse<T>(response: Response, url?: string): Promise<T> {
  if (!response.ok) {
    let errorData: any = {};
    let errorMessage = response.statusText || "Ett okänt fel uppstod";

    try {
      errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      // If JSON parsing fails, use status text
    }

    // Add context for specific error types
    if (response.status === 404) {
      errorMessage = `Resursen hittades inte: ${url || 'okänd'}`;
    } else if (response.status === 403) {
      errorMessage = "Du har inte behörighet för denna åtgärd";
    } else if (response.status === 401) {
      errorMessage = "Du måste logga in igen";
    } else if (response.status === 429) {
      errorMessage = "För många förfrågningar. Vänta en stund och försök igen.";
    } else if (response.status >= 500) {
      errorMessage = "Serverfel. Försök igen senare.";
    }

    throw new ApiError(
      errorMessage,
      response.status,
      errorData.code,
      errorData.details
    );
  }
  
  if (response.status === 204) return {} as T;
  
  try {
    return await response.json();
  } catch (error) {
    throw new ApiError(
      "Ogiltigt svar från servern",
      response.status,
      'INVALID_RESPONSE'
    );
  }
}

// Retry configuration
interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

// Helper function for exponential backoff delay
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay + Math.random() * 1000, maxDelay);
}

// Enhanced fetch with retry logic
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    baseDelay = 200,
    maxDelay = 10000
  } = retryOptions;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Check if we should retry based on status
      if (response.ok || attempt === maxRetries) {
        return response;
      }

      const apiError = new ApiError(
        response.statusText,
        response.status
      );

      if (!apiError.isRetryable) {
        return response; // Don't retry client errors (except 408, 429)
      }

      lastError = apiError;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if it's the last attempt
      if (attempt === maxRetries) {
        break;
      }
    }

    // Wait before retrying
    if (attempt < maxRetries) {
      const delay = calculateDelay(attempt, baseDelay, maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error('All retry attempts failed');
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
  fetchWithRetry(`${API_BASE_URL}/staff`, { credentials: "include" }).then((res) =>
    handleResponse<Staff[]>(res, '/staff')
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

// Care Plan API
export const getCarePlan = (clientId: string): Promise<any> =>
  fetch(`${API_BASE_URL}/care-plans/${clientId}`, { credentials: "include" }).then(
    (res) => handleResponse<any>(res)
  );
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
export const deleteCarePlan = (id: string): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/care-plans/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then((res) => handleResponse<{ message: string }>(res));

// Implementation Plan API
export const getImplementationPlan = (clientId: string): Promise<any> =>
  fetch(`${API_BASE_URL}/implementation-plans/${clientId}`, { 
    credentials: "include" 
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
export const deleteImplementationPlan = (id: string): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/implementation-plans/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then((res) => handleResponse<{ message: string }>(res));

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

// Implementation Plans API (additional functions)
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

// Monthly Reports API
export const getMonthlyReports = (): Promise<any[]> =>
  fetch(`${API_BASE_URL}/monthly-reports`, { credentials: "include" }).then(
    (res) => handleResponse<any[]>(res)
  );

export const getMonthlyReportsByClient = (clientId: string): Promise<any[]> =>
  fetch(`${API_BASE_URL}/monthly-reports/${clientId}`, {
    credentials: "include",
  }).then((res) => handleResponse<any[]>(res));

export const createMonthlyReport = (data: any): Promise<any> =>
  fetch(`${API_BASE_URL}/monthly-reports`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

// Vimsa Time API
export const getVimsaTime = (): Promise<any[]> =>
  fetch(`${API_BASE_URL}/vimsa-time`, { credentials: "include" }).then((res) =>
    handleResponse<any[]>(res)
  );

export const getVimsaTimeByClient = (clientId: string): Promise<any[]> =>
  fetch(`${API_BASE_URL}/vimsa-time/${clientId}`, {
    credentials: "include",
  }).then((res) => handleResponse<any[]>(res));

export const createVimsaTime = (data: any): Promise<any> =>
  fetch(`${API_BASE_URL}/vimsa-time`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }).then((res) => handleResponse<any>(res));

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

// GFP API - New endpoints as per requirements
export interface GfpPlan {
  id: string;
  title: string;
  clientRef: string;
  goals: Array<{ text: string }>;
  version: number;
  locked: boolean;
  createdAt: string;
  updatedAt: string;
}

// GET /api/gfp?clientRef=... (lista)
export const getGfpPlans = (clientRef: string): Promise<GfpPlan[]> =>
  fetchWithRetry(`${API_BASE_URL}/gfp?clientRef=${encodeURIComponent(clientRef)}`, {
    credentials: "include",
  }).then((res) => handleResponse<GfpPlan[]>(res, `/gfp?clientRef=${clientRef}`));

// GET /api/gfp/:id
export const getGfpPlan = (id: string): Promise<GfpPlan> =>
  fetchWithRetry(`${API_BASE_URL}/gfp/${id}`, {
    credentials: "include",
  }).then((res) => handleResponse<GfpPlan>(res, `/gfp/${id}`));

// POST /api/gfp (skapar; kräver title, clientRef, goals[])
export const createGfpPlan = (data: GfpCreate): Promise<GfpPlan> =>
  fetchWithRetry(`${API_BASE_URL}/gfp`, {
    method: "POST",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }, { maxRetries: 2 }).then((res) => handleResponse<GfpPlan>(res, '/gfp'));

// PUT /api/gfp/:id (optimistic concurrency via version)
export const updateGfpPlan = (id: string, data: GfpUpdate): Promise<GfpPlan> =>
  fetchWithRetry(`${API_BASE_URL}/gfp/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }, { maxRetries: 2 }).then((res) => handleResponse<GfpPlan>(res, `/gfp/${id}`));

// PATCH /api/gfp/:id/lock body: { locked: boolean }
export const lockGfpPlan = (id: string, data: GfpLock): Promise<GfpPlan> =>
  fetchWithRetry(`${API_BASE_URL}/gfp/${id}/lock`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    credentials: "include",
    body: JSON.stringify(data),
  }, { maxRetries: 1 }).then((res) => handleResponse<GfpPlan>(res, `/gfp/${id}/lock`));

// DELETE /api/gfp/:id
export const deleteGfpPlan = (id: string): Promise<{ message: string }> =>
  fetch(`${API_BASE_URL}/gfp/${id}`, {
    method: "DELETE",
    credentials: "include",
  }).then((res) => handleResponse<{ message: string }>(res));
