# Quick Reference Guide - Validation Rules

## Summary of All Validations

### ✅ 1. Task Assignment Date (Admin)
- **Rule**: No past dates allowed
- **Allows**: Today and future dates only
- **File**: `backend/validators/taskValidators.js`
- **Message**: "Task date cannot be earlier than today. Please select today or a future date."

### ✅ 2. Death Report Date
- **Rule**: No future dates allowed
- **Allows**: Today and past dates only
- **Files**: 
  - `backend/validators/deathValidators.js` (new)
  - `backend/routes/DeathRegistration.js` (updated)
- **Message**: "Death date cannot be in the future. Please select a valid date."

### ✅ 3. Single User Birth Certificate Block
- **Rule**: Single users cannot apply for child birth certificates
- **Allows**: Only married/divorced/widowed users
- **File**: `backend/routes/BirthCertification.js`
- **Message**: "You are currently single and cannot apply for a child birth certificate. You can still apply for your own birth certificate."

### ✅ 4. Marriage Duration (18 Months)
- **Rule**: Must wait 18 months after marriage before child birth certificate
- **Allows**: Applications after 18+ months of marriage
- **File**: `backend/routes/BirthCertification.js`
- **Message**: "You recently got married. Child birth certificate registration is available after at least 1 year and 6 months from the marriage date."

---

## Testing Commands

### Start the Backend Server
```bash
cd backend
node server.js
# or
npm start
```

### Test Endpoints

#### 1. Test Task Assignment (Admin)
```bash
# Should FAIL - past date
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "task_type": "birth_certificate",
    "assigned_to": 2,
    "due_date": "2026-05-20"
  }'

# Should SUCCEED - today or future
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "task_type": "birth_certificate",
    "assigned_to": 2,
    "due_date": "2026-05-27"
  }'
```

#### 2. Test Death Registration
```bash
# Should FAIL - future date
curl -X POST http://localhost:5000/api/death-registration \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deceased_resident_id": 5,
    "death_date": "2026-06-01",
    "cause_of_death": "Natural causes"
  }'

# Should SUCCEED - past date
curl -X POST http://localhost:5000/api/death-registration \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deceased_resident_id": 5,
    "death_date": "2026-05-20",
    "cause_of_death": "Natural causes"
  }'
```

#### 3. Test Birth Certificate (Single User)
```bash
# Should FAIL - single user
curl -X POST http://localhost:5000/api/birth-certification \
  -H "Authorization: Bearer SINGLE_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "child_name": "Test Child",
    "birth_place": "Addis Ababa",
    "birth_date": "2025-01-01",
    "target_child_id": 1
  }'
```

#### 4. Test Birth Certificate (Marriage Duration)
```bash
# Should FAIL - married less than 18 months
# Should SUCCEED - married 18+ months
curl -X POST http://localhost:5000/api/birth-certification \
  -H "Authorization: Bearer MARRIED_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "child_name": "Test Child",
    "birth_place": "Addis Ababa",
    "birth_date": "2025-01-01",
    "target_child_id": 1
  }'
```

---

## Database Queries for Testing

### Check User Marital Status
```sql
SELECT id, firstname, lastname, marital_status 
FROM residents 
WHERE user_id = YOUR_USER_ID;
```

### Check Marriage Date
```sql
SELECT r.firstname, r.lastname, c.marriage_date, c.status
FROM residents r
JOIN certificates c ON r.id = c.resident_id
WHERE c.certificate_type = 'marriage' 
  AND r.user_id = YOUR_USER_ID
ORDER BY c.approved_at DESC
LIMIT 1;
```

### Calculate Marriage Duration
```sql
SELECT 
  r.firstname,
  r.lastname,
  c.marriage_date,
  TIMESTAMPDIFF(MONTH, c.marriage_date, NOW()) as months_married
FROM residents r
JOIN certificates c ON r.id = c.resident_id
WHERE c.certificate_type = 'marriage' 
  AND c.status = 'approved'
  AND r.user_id = YOUR_USER_ID;
```

### Check Tasks with Due Dates
```sql
SELECT id, title, due_date, status, created_at
FROM tasks
ORDER BY created_at DESC
LIMIT 10;
```

---

## Troubleshooting

### Issue: Validation not working
**Solution**: Restart the backend server after code changes

### Issue: "Cannot find module" error
**Solution**: Install dependencies
```bash
cd backend
npm install express-validator
```

### Issue: Marriage duration check not working
**Possible Causes**:
1. No approved marriage certificate in database
2. Marriage date is NULL
3. User marital_status not set to 'married'

**Check**:
```sql
SELECT * FROM certificates 
WHERE resident_id = YOUR_RESIDENT_ID 
  AND certificate_type = 'marriage' 
  AND status = 'approved';
```

### Issue: Single user validation not working
**Check marital status**:
```sql
SELECT marital_status FROM residents WHERE user_id = YOUR_USER_ID;
```

---

## Files Changed

### New Files (2)
1. ✅ `backend/validators/deathValidators.js`
2. ✅ `backend/validators/birthValidators.js`

### Modified Files (3)
1. ✅ `backend/validators/taskValidators.js`
2. ✅ `backend/routes/DeathRegistration.js`
3. ✅ `backend/routes/BirthCertification.js`

### Documentation Files (2)
1. ✅ `VALIDATION_CHANGES_SUMMARY.md`
2. ✅ `QUICK_REFERENCE.md` (this file)

---

## Rollback Instructions

If you need to revert these changes:

### 1. Restore Task Validator
```javascript
// In backend/validators/taskValidators.js
body('due_date')
  .optional()
  .isDate()
  .withMessage('Invalid due date'),
```

### 2. Remove Death Validator
```bash
rm backend/validators/deathValidators.js
```

### 3. Restore Death Registration Route
Remove the validator import and validation check from `backend/routes/DeathRegistration.js`

### 4. Restore Birth Certificate Route
Remove the single user check and marriage duration check from `backend/routes/BirthCertification.js`

---

## Contact & Support

For questions or issues with these validations, check:
1. `VALIDATION_CHANGES_SUMMARY.md` - Detailed documentation
2. Code comments in modified files
3. Error messages in backend logs

---

**Last Updated**: 2026-05-26
**Version**: 1.0
**Status**: ✅ Production Ready
