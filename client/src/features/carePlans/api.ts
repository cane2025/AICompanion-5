import { apiRequest } from "@/lib/api";

export const listCarePlans = (clientId: string) =>
  apiRequest("GET", `/api/care-plans/client/${clientId}`).then((r) => r.json());

export const createCarePlan = (body: any) =>
  apiRequest("POST", "/api/care-plans", body).then((r) => r.json());

export const updateCarePlan = (id: string, body: any) =>
  apiRequest("PUT", `/api/care-plans/${id}`, body).then((r) => r.json());

export const deleteCarePlan = (id: string) =>
  apiRequest("DELETE", `/api/care-plans/${id}`).then((r) => r.ok);
