import React from "react";
import { CarePlanDialog } from "./care-plan-dialog";
import { CarePlanDialogCompact } from "./care-plan-dialog-compact";

interface CarePlanDialogWrapperProps {
  trigger?: React.ReactNode;
  staffId?: string;
  onSuccess?: () => void;
}

export function CarePlanDialogWrapper(props: CarePlanDialogWrapperProps) {
  // Check feature flag from environment variable or localStorage
  const useCompactUI = 
    import.meta.env.VITE_UI_CAREPLAN_COMPACT === "1" || 
    localStorage.getItem("UI_CAREPLAN_COMPACT") === "1" ||
    new URLSearchParams(window.location.search).get("ui_compact") === "1";

  if (useCompactUI) {
    return <CarePlanDialogCompact {...props} />;
  }

  return <CarePlanDialog {...props} />;
}