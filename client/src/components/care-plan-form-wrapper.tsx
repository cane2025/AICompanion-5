import React from "react";
import { SimpleWorkingCarePlan } from "./simple-working-care-plan";
import { CompactCarePlanForm } from "./compact-care-plan-form";

interface CarePlanFormWrapperProps {
  onSuccess?: () => void;
  initialData?: any;
}

export function CarePlanFormWrapper({ onSuccess, initialData }: CarePlanFormWrapperProps) {
  // Feature flag for compact care plan UI
  const isCompactUIEnabled = React.useMemo(() => {
    // Check environment variable
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('UI_CAREPLAN_COMPACT') === '1' ||
             new URLSearchParams(window.location.search).get('compact') === '1';
    }
    return process.env.UI_CAREPLAN_COMPACT === '1';
  }, []);

  if (isCompactUIEnabled) {
    return <CompactCarePlanForm onSuccess={onSuccess} initialData={initialData} />;
  }

  return <SimpleWorkingCarePlan />;
}

// Export both for flexibility
export { SimpleWorkingCarePlan, CompactCarePlanForm };