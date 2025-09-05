# Migration Guide: Moving Changes to PR #47

## Overview
This guide provides step-by-step instructions for transferring the MonthlyReport component and type fixes from the current branch to PR #47.

## Step 1: Prepare PR #47 Branch
```bash
# Switch to PR #47 branch
git checkout [PR-47-branch-name]

# Pull latest changes
git pull origin [PR-47-branch-name]
```

## Step 2: Create MonthlyReport Component
Create the new directory and component:
```bash
# Create reports directory
mkdir -p client/src/features/reports

# Copy the MonthlyReport component
# (Copy content from client/src/features/reports/MonthlyReport.tsx)
```

## Step 3: Apply Type Fixes

### Client-side Fixes
Apply these changes to the following files:

#### `client/src/components/Login.tsx`
```typescript
// Change line 8 from:
import { validateLogin } from "@shared/validation";
// To:
import { validateLogin } from "@/shared/validation";
```

#### `client/src/components/editable-care-plan.tsx`
```typescript
// Line 77: Change API function name
queryFn: () => api.getCarePlanByClient(clientId),

// Lines 114, 247: Fix status type casting
status: (carePlan.status as "received" | "staff_notified" | "in_progress" | "completed") || "received",

// Line 411: Fix Date constructor
(form.watch("staffNotifiedDate") ? new Date(form.watch("staffNotifiedDate")!).getTime() : 0) +
```

#### `client/src/components/editable-implementation-plan.tsx`
```typescript
// Line 79: Change API function name
queryFn: () => api.getImplementationPlanByClient(clientId),

// Lines 108, 250: Fix status type casting
status: (implementationPlan.status as "pending" | "in_progress" | "completed") || "pending",

// Lines 111-113, 253-255: Fix date type conversions
dueDate: implementationPlan.dueDate ? new Date(implementationPlan.dueDate).toISOString().split('T')[0] : "",
completedDate: implementationPlan.completedDate ? new Date(implementationPlan.completedDate).toISOString().split('T')[0] : "",
sentDate: implementationPlan.sentDate ? new Date(implementationPlan.sentDate).toISOString().split('T')[0] : "",
```

#### `client/src/components/client-detail-view.tsx`
```typescript
// Line 404: Fix null assignment
carePlanDate={carePlan?.staffNotifiedDate || undefined}
```

#### `client/src/components/quick-search.tsx`
```typescript
// Line 7: Fix import
import { useDebounce, useDebouncedCallback } from "@/hooks/use-debounce";

// Lines 41-42: Comment out non-existent hook
// usePerformanceMonitor('QuickSearch render', [query]);

// Lines 176-183: Replace with working implementation
const debouncedQuery = useDebounce(query, 300);
const searchResults = useMemo(() => {
  if (!debouncedQuery.trim()) return [];
  
  return searchableItems.filter(item => 
    item.searchText.toLowerCase().includes(debouncedQuery.toLowerCase())
  ).slice(0, 8);
}, [searchableItems, debouncedQuery]);

// Line 304: Add type annotations
{searchResults.map((result: any, index: number) => (
```

#### `client/src/components/staff-sidebar.tsx`
```typescript
// Line 205: Add type annotation
const clientCount = clients?.filter((c: any) => c.staffId === staffMember?.id)?.length || 0;

// Lines 233-245: Fix Lucide icon title props
{isOverloaded ? (
  <div title={`Överbelastad: ${Math.round(workloadPercentage)}% av kapacitet (${clientCount} klienter, ${capacity}h/vecka)`}>
    <AlertTriangle className="h-4 w-4 text-red-500" />
  </div>
) : isWorking ? (
  <div title={`Arbetar: ${Math.round(workloadPercentage)}% av kapacitet (${clientCount} klienter)`}>
    <CircleDot className="h-4 w-4 text-green-500" />
  </div>
) : (
  <div title="Ledig - inga klienter">
    <Circle className="h-4 w-4 text-gray-400" />
  </div>
)}
```

#### `client/src/features/UI_DASHBOARD_V2/components/cards/CarePlansCard.tsx`
```typescript
// Line 69: Fix status type casting
<StatusChip status={r.status as "waiting" | "active" | "overdue" | "completed"} />
```

#### `client/src/components/ErrorBoundary.tsx`
```typescript
// Lines 177-179: Fix component props
const WrappedComponent: React.FC<P> = (props) => (
  <ErrorBoundary>
    <Component {...props} />
  </ErrorBoundary>
);
```

### Server-side Fixes

#### `server/routes/auth.ts`
```typescript
// Line 3: Fix import
import { db } from "../store";
```

#### `server/storage.ts`
```typescript
// Lines 245-261: Add missing Staff properties
const staff: Staff = {
  id,
  name,
  fullName: name,  // Add this
  initials: this.getInitials(name),
  personnummer: null,
  telefon: null,
  epost: null,
  adress: null,
  anställningsdatum: null,
  roll: null,
  avdelning: null,
  weeklyCapacityHours: 40,  // Add this
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

// Lines 283-299: Add missing properties in createStaff
const staff: Staff = {
  id,
  name: insertStaff.name,
  fullName: insertStaff.fullName || insertStaff.name,  // Add this
  initials: insertStaff.initials,
  personnummer: insertStaff.personnummer || null,
  telefon: insertStaff.telefon || null,
  epost: insertStaff.epost || null,
  adress: insertStaff.adress || null,
  anställningsdatum: insertStaff.anställningsdatum || null,
  roll: insertStaff.roll || null,
  avdelning: insertStaff.avdelning || null,
  weeklyCapacityHours: insertStaff.weeklyCapacityHours || 40,  // Add this
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

// Lines 325-329, 339-341, 352-354: Fix Date types
updatedAt: new Date()  // Instead of new Date().toISOString()
```

## Step 4: Verify Integration
After applying all changes, verify the MonthlyReport component works:

1. **Check Import**: Ensure `ClientDetailView.tsx` imports MonthlyReport correctly
2. **Test Rendering**: Verify component renders in the monthly-reports tab
3. **Test CRUD**: Test create, read, update, delete operations
4. **Check API**: Verify API endpoints respond correctly

## Step 5: Run Tests
```bash
# Type check
npm run check

# Build test
npm run build

# Start server and test API
npm run dev
```

## Step 6: Update Documentation
Add the following to your PR #47:

### RELEASENOTES.md
Add the content from `RELEASE_NOTES_UPDATE.md`

### TEST-LOGG.md
Add the content from `TEST_LOG_UPDATE.md`

## Step 7: Handle Conflicts
If conflicts arise during merge:

1. **Prioritize MonthlyReport component** - This is the main feature
2. **Keep type fixes** - These are necessary for build stability
3. **Preserve existing functionality** - Don't break working features
4. **Test after resolution** - Run build and type check after resolving conflicts

## Step 8: Final Verification
Before closing this PR and finalizing PR #47:

1. ✅ Build passes without errors
2. ✅ TypeScript check passes
3. ✅ MonthlyReport component renders correctly
4. ✅ CRUD operations work end-to-end
5. ✅ No regressions in existing functionality
6. ✅ Documentation updated

## Troubleshooting

### Common Issues:
- **Import errors**: Check file paths and ensure files exist
- **Type errors**: Verify schema types match database structure
- **API errors**: Check endpoint URLs and data structure
- **Component not rendering**: Verify import and usage in parent component

### Rollback Plan:
If issues arise, you can:
1. Revert specific file changes
2. Use git to rollback to previous working state
3. Apply changes incrementally to isolate issues

## Success Criteria
PR #47 should have:
- ✅ Working MonthlyReport component
- ✅ All TypeScript errors resolved
- ✅ Successful build
- ✅ End-to-end functionality verified
- ✅ Updated documentation
- ✅ No regressions