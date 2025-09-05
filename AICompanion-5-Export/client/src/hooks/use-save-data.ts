import { useState, useRef, useEffect } from "react";
import * as z from "zod";

export interface SaveDataOptions {
  url: string;
  // ...other option properties...
  payloadSchema?: z.ZodSchema<any>;
}

export function useSaveData(endpointOrOptions: string | SaveDataOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllers = useRef<AbortController[]>([]);

  async function saveData(data?: any): Promise<any> {
    const controller = new AbortController();
    abortControllers.current.push(controller);
    setIsLoading(true);
    try {
      const url =
        typeof endpointOrOptions === "string"
          ? endpointOrOptions
          : endpointOrOptions.url;

      // Validate payload if a schema is provided
      if (
        typeof endpointOrOptions !== "string" &&
        endpointOrOptions.payloadSchema
      ) {
        const result = endpointOrOptions.payloadSchema.safeParse(data);
        if (!result.success) {
          throw new Error("Payload validation failed");
        }
      }

      // ...construct additional fetch options if needed...
      const res = await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          // ...existing headers if any...
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error saving data");
      }
      return await res.json();
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
      abortControllers.current = abortControllers.current.filter(
        (c) => c !== controller
      );
    }
  }

  useEffect(() => {
    return () => {
      abortControllers.current.forEach((controller) => controller.abort());
    };
  }, []);

  return { saveData, isLoading, error };
}
