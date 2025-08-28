import { apiRequest } from "@/lib/queryClient";

export const listImplementationPlans = (clientId: string) =>
  apiRequest("GET", `/api/implementation-plans/client/${clientId}`).then((r) =>
    r.json()
  );

export const createImplementationPlan = (body: any) =>
  apiRequest("POST", "/api/implementation-plans", body).then((r) => r.json());

export const updateImplementationPlan = (id: string, body: any) =>
  apiRequest("PUT", `/api/implementation-plans/${id}`, body).then((r) =>
    r.json()
  );

export const deleteImplementationPlan = (id: string) =>
  apiRequest("DELETE", `/api/implementation-plans/${id}`).then((r) => r.ok);
