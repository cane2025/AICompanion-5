import { apiRequest } from "@/lib/queryClient";

export const listWeeklyDocs = (clientId: string) => {
  const url = clientId
    ? `/api/weekly-docs/client/${clientId}`
    : "/api/weekly-docs";
  return apiRequest("GET", url).then((r) => r.json());
};

export const createWeeklyDoc = (body: any) =>
  apiRequest("POST", "/api/weekly-docs", body).then((r) => r.json());

export const createWeeklyDocEntry = (docId: string, entryData: any) =>
  apiRequest("POST", `/api/weekly-docs/${docId}/entries`, entryData).then((r) =>
    r.json()
  );

export const updateWeeklyDocEntry = (
  docId: string,
  entryId: string,
  patch: any
) =>
  apiRequest("PUT", `/api/weekly-docs/${docId}/entries/${entryId}`, patch).then(
    (r) => r.json()
  );

export const deleteWeeklyDocEntry = (docId: string, entryId: string) =>
  apiRequest("DELETE", `/api/weekly-docs/${docId}/entries/${entryId}`).then(
    (r) => r.ok
  );
