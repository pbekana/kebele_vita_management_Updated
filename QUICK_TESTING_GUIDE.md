# Quick Testing Guide

## How to Test All New Features

### Prerequisites
```bash
# Start Backend
cd backend
node server.js

# Start Frontend (in another terminal)
cd frontend
npm run dev
```

---

## 1. Test Task Assignment & Update

### Step 1: Create a Task
1. Login as **Admin**
2. Navigate to **Task Assignment** tab
3. Fill in the form:
   - Title: "Test Task"
   - Task Type: "Birth Certificate"
   - Description: "Test description"
   - Assign To: Select a staff member
   - Due Date: Select tomorrow's date
4. Click **"Assign Task"**
5. ✅ Should see success message: "Task assigned successfully!"

### Step 2: Edit the Task
1. Find the task in the table below
2. Click **"Edit"** button in Actions column
3. Edit modal should open
4. Change:
   - Title to "Updated Test Task"
   - Description to "Updated description"
   - Due Date to a different future date
5. Click **"Update Task"**
6. ✅ Should see success message: "Task updated successfully!"
7. ✅ Task list should refresh with new values

### Step 3: Reassign the Task
1. Find the task in the table
2. Use the **"Reassign..."** dropdown in Actions column
3. Select a different staff member
4. ✅ Should see success message: "Task reassigned successfully!"
5. ✅ Task list should refresh showing new staff member

### Step 4: Test Date Validation
1. Try to create a task with **yesterday's date**
2. ✅ Should see error: "Task date cannot be earlier than today. Please select today or a future date."

---

## 2. Test Data Synchronization

### Scenario: Marriage Status Update

1. Login as **Resident** (single user)
2. Try to apply for **Child Birth Certificate**
3. ✅ Should see error: "You are currently single and cannot apply for a child birth certificate..."

4. Apply for **Marriage Certificate**
5. Admin approves the marriage certificate
6. ✅ Resident's marital_status should update to "married" in database

7. Try to apply for **Child Birth Certificate** immediately after marriage
8. ✅ Should see error: "You recently got married. Child birth certificate registration is available after at least 1 year and 6 months..."

9. Wait 18 months (or manually update marriage_date in database to 18+ months ago)
10. Try to apply for **Child Birth Certificate** again
11. ✅ Should now be allowed to proceed

---

## 3. Test Staff Certificate Display

### Step 1: Assign Certificate to Staff
1. Login as **Admin**
2. Go to **Certificates** tab
3. Find a pending certificate
4. Assign it to a staff member

### Step 2: View as Staff
1. Login as **Staff** (the assigned staff member)
2. Go to **My Assigned Certificates**
3. Click **"Open"** on the certificate
4. ✅ Detail modal should show:
   - **Labels with values** (e.g., "Child's Full Name: John Doe")
   - NOT just field names without values
   - All fields properly formatted
   - Missing data shows "—"

### Example Expected Display:
```
Type: BIRTH
Status: Assigned

Vital Record Details:
Child's Full Name: John Doe
Date of Birth: 01/01/2020
Place of Birth: Addis Ababa
Mother's Full Name: Jane Doe
Father's Full Name: John Doe Sr.
```

---

## 4. Test Birth Certificate Options

### Step 1: Check Options
1. Login as **Resident**
2. Navigate to **Apply for Certificate**
3. Select **Birth Certificate**
4. ✅ Should see only **2 options**:
   - **My Self** (for own birth certificate)
   - **For My Child** (for child birth registration)
5. ✅ Should NOT see "For Someone Else" option

---

## 5. Test Error Messages

### Test 1: Missing Required Fields
1. Try to create a task without filling in Title
2. ✅ Should see: "Title is required"

### Test 2: Invalid Date (Death Certificate)
1. Try to register a death with tomorrow's date
2. ✅ Should see: "Death date cannot be in the future. Please select a valid date."

### Test 3: Invalid Date (Task Assignment)
1. Try to create a task with yesterday's date
2. ✅ Should see: "Task date cannot be earlier than today. Please select today or a future date."

### Test 4: Single User Birth Certificate
1. Login as single resident
2. Try to apply for child birth certificate
3. ✅ Should see: "You are currently single and cannot apply for a child birth certificate. You can still apply for your own birth certificate."

### Test 5: Marriage Duration
1. Login as recently married resident (< 18 months)
2. Try to apply for child birth certificate
3. ✅ Should see: "You recently got married. Child birth certificate registration is available after at least 1 year and 6 months from the marriage date."

### Test 6: Permission Denied
1. Try to access admin endpoint as regular user
2. ✅ Should see: "You do not have permission to perform this action."

### Test 7: Database Error
1. Stop the database server
2. Try to create a task
3. ✅ Should see: "Unable to save changes. Please try again." or similar

---

## Database Verification Queries

### Check Task Updates
```sql
SELECT id, title, description, assigned_to, due_date, updated_at 
FROM tasks 
ORDER BY updated_at DESC 
LIMIT 5;
```

### Check Marital Status
```sql
SELECT id, firstname, lastname, marital_status 
FROM residents 
WHERE user_id = YOUR_USER_ID;
```

### Check Marriage Date
```sql
SELECT r.firstname, r.lastname, c.marriage_date, c.status,
       TIMESTAMPDIFF(MONTH, c.marriage_date, NOW()) as months_married
FROM residents r
JOIN certificates c ON r.id = c.resident_id
WHERE c.certificate_type = 'marriage' 
  AND c.status = 'approved'
  AND r.user_id = YOUR_USER_ID;
```

### Check Task Assignment
```sql
SELECT t.id, t.title, t.assigned_to, u.email as staff_email, t.status, t.due_date
FROM tasks t
JOIN users u ON t.assigned_to = u.id
ORDER BY t.created_at DESC
LIMIT 10;
```

---

## Common Test Scenarios

### Scenario 1: Complete Task Lifecycle
1. Admin creates task → ✅ Task appears in list
2. Admin edits task → ✅ Changes reflect immediately
3. Admin reassigns task → ✅ New staff member assigned
4. Staff views task → ✅ Staff sees updated task
5. Staff completes task → ✅ Status updates to completed

### Scenario 2: Birth Certificate Journey
1. Single user tries to apply → ✅ Blocked with message
2. User gets married → ✅ Marital status updates
3. User tries to apply immediately → ✅ Blocked (< 18 months)
4. 18 months pass → ✅ User can now apply
5. User submits application → ✅ Certificate created

### Scenario 3: Certificate Processing
1. Resident submits certificate → ✅ Status: Pending
2. Admin assigns to staff → ✅ Status: Assigned
3. Staff opens certificate → ✅ All details visible with labels
4. Staff processes → ✅ Status: Processing
5. Staff submits for approval → ✅ Status: Ready for Approval
6. Admin approves → ✅ Status: Approved

---

## Troubleshooting

### Issue: Changes not reflecting
**Solution**: 
- Refresh the page (F5)
- Check browser console for errors
- Verify backend server is running
- Check database connection

### Issue: Error messages not showing
**Solution**:
- Check NotificationProvider is working
- Verify error response format from backend
- Check browser console for JavaScript errors

### Issue: Task edit modal not opening
**Solution**:
- Check React DevTools for state
- Verify editingTask state is being set
- Check for JavaScript errors in console

### Issue: Birth certificate still shows 3 options
**Solution**:
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Rebuild frontend: `npm run build`

---

## Success Criteria

All features are working correctly if:

✅ Tasks can be created, edited, and reassigned
✅ Task updates reflect immediately in the UI
✅ Staff sees updated task information
✅ Date validations work (no past dates for tasks, no future dates for deaths)
✅ Birth certificate shows only 2 options (My Self, For My Child)
✅ Staff certificate display shows labels with actual values
✅ Single users cannot apply for child birth certificates
✅ Marriage duration validation works (18 months minimum)
✅ All error messages are clear and specific
✅ No generic empty errors
✅ Database updates correctly
✅ Frontend and backend stay synchronized

---

## Performance Benchmarks

Expected response times:
- Task creation: < 500ms
- Task update: < 300ms
- Task list refresh: < 200ms
- Certificate detail load: < 400ms
- Form validation: Instant (< 50ms)

If any operation takes longer, check:
- Database connection
- Network latency
- Server load
- Query optimization

---

## Test Users

### Admin User
- Email: admin@example.com
- Role: admin
- Can: Create/edit/reassign tasks, approve certificates

### Staff User
- Email: staff@example.com
- Role: kebele_staff
- Can: View assigned tasks, process certificates

### Resident User (Single)
- Email: resident1@example.com
- Role: resident
- Marital Status: single
- Can: Apply for own certificates only

### Resident User (Married)
- Email: resident2@example.com
- Role: resident
- Marital Status: married
- Can: Apply for child certificates (if 18+ months married)

---

**Testing Date**: 2026-05-26
**Version**: 2.0
**Status**: Ready for Testing
