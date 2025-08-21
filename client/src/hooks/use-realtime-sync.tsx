import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Disable WebSocket in development mode to avoid localhost:undefined issues
    if (process.env.NODE_ENV === "development") {
      console.log(
        "WebSocket disabled in development mode - using Vite HMR instead"
      );
      return;
    }

    // Get the correct protocol and URL for WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected for real-time sync");
    };

    ws.onmessage = (event) => {
      try {
        const { type } = JSON.parse(event.data);

        // Invalidate relevant queries to fetch fresh data
        if (type === "staff") {
          queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
        }
        if (type === "clients") {
          queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
        }
        if (type === "carePlans") {
          queryClient.invalidateQueries({ queryKey: ["/api/care-plans"] });
        }
        if (type === "implementationPlans") {
          queryClient.invalidateQueries({
            queryKey: ["/api/implementation-plans"],
          });
        }

        console.log(`Real-time update received: ${type}`);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    // Cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [queryClient]);
}
