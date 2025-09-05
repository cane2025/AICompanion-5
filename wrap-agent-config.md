# Wrap.dev Agent Configuration för UNGDOMS Öppenvård

## System Information

- **Frontend URL**: http://127.0.0.1:5175
- **Backend API**: http://127.0.0.1:3001/api
- **System**: UNGDOMS Öppenvård - Vårdadministration

## Agent Tasks

### 1. **Login Testing Agent**

```
Task: Test login functionality
URL: http://127.0.0.1:5175
Steps:
1. Navigate to login page
2. Enter username: "testuser"
3. Enter password: "testpass"
4. Click login button
5. Verify successful login (should see staff sidebar)
6. Report: Login works with any credentials ✅
```

### 2. **Staff Management Agent**

```
Task: Test staff management
Steps:
1. After login, verify staff sidebar is visible
2. Check that staff list shows "Behandlare" (not "Socialsekreterare")
3. Test "Lägg till personal" button
4. Add new staff member
5. Verify alphabetical sorting
6. Report: Staff management functionality ✅
```

### 3. **Care Plan Creation Agent**

```
Task: Test vårdplan creation
Steps:
1. Click on a staff member in sidebar
2. Look for "Skapa Vårdplan" button
3. Click button - verify dialog opens (no blank page)
4. Fill in form:
   - Behandlare: "Test Behandlare"
   - Klientinitialer: "AB"
   - Vårdplansnummer: "1"
   - Mottagningsdatum: Today's date
5. Click "Spara vårdplan" button
6. Verify success message
7. Report: Care plan creation works ✅
```

### 4. **GFP (Implementation Plan) Agent**

```
Task: Test genomförandeplan
Steps:
1. Navigate to client detail view
2. Look for "Genomförandeplan" tab/section
3. Click "Skapa Genomförandeplan"
4. Verify form has ONLY admin fields:
   - Planreferens (vilken genomförandeplan)
   - Skickad datum
   - Klar datum
   - Uppföljning 1-6 checkboxes
5. Fill form and click "Spara"
6. Verify NO "mål/planinnehåll" fields exist
7. Report: GFP has correct admin-only fields ✅
```

### 5. **Weekly Documentation Agent**

```
Task: Test veckodokumentation
Steps:
1. Find "Veckodokumentation" section
2. Click "Skapa Veckodokumentation"
3. Verify ALL 7 days are visible (Mån-Sön)
4. Click on different days to mark them
5. Fill documentation text
6. Set status to "Godkänt"
7. Click "Spara" button
8. Report: Weekly docs with all days work ✅
```

### 6. **Monthly Report Agent**

```
Task: Test månadsrapport
Steps:
1. Find "Månadsrapport" section
2. Click create/edit button
3. Verify NO blank pages appear
4. Check status shows "Godkänt/ej godkänt" (not just "Status")
5. Fill report content
6. Set approval status
7. Click "Spara"
8. Test edit existing report (no blank pages)
9. Report: Monthly reports work without blank pages ✅
```

### 7. **Vimsa Time Agent**

```
Task: Test Visma Tid
Steps:
1. Find "Vimsa Tid" section
2. Click create/edit
3. Verify fields match backend:
   - År, Vecka
   - Arbetade timmar
   - Status: "Godkänt/ej godkänt"
   - Stämmer med dokumentation: Ja/Nej
4. Fill and save
5. Test CRUD operations
6. Report: Vimsa Time has correct fields ✅
```

### 8. **Navigation Agent**

```
Task: Test navigation and no blank pages
Steps:
1. Navigate through all sections
2. Open all dialogs
3. Verify NO blank pages appear anywhere
4. Test back navigation from detail views
5. Verify smooth transitions
6. Report: Navigation works without blank pages ✅
```

## Expected Results

All agents should report ✅ for their respective tasks.
If any agent reports ❌, investigate and fix the issue.

## API Endpoints to Validate

- POST /api/auth/login → 201 + user
- GET /api/staff → staff list
- POST /api/clients → 201 + id
- POST /api/care-plans → 201 + id
- POST /api/implementation-plans → 201 + id
- POST /api/weekly-documentation → 201 + id
- POST /api/monthly-reports → 201 + id
- POST /api/vimsa-time → 201 + id
