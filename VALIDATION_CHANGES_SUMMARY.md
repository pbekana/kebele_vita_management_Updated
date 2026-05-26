# Validation Changes Summary

## Overview
This document summarizes all validation and business rule changes implemented in the Kebele Vital Management System. All changes preserve existing functionality and only add new validations.

---

## 1. Admin Task Assignment Date Validation ✅

### Location
- **File**: `backend/validators/taskValidators.js`
- **Endpoint**: `POST /api/tasks`

### Changes Made
- Added custom validator to `due_date` field
- Prevents selection of dates before today
- Allows today's date and future dates only

### Validation Logic
```javascript
.custom((value) => {
  if (value) {
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      throw new Error('Task date cannot be earlier than today. Please select today or a future date.');
    }
  }
  return true;
})
```

### Error Message
> "Task date cannot be earlier than today. Please select today or a future date."

### Testing
- Try creating a task with yesterday's date → Should fail
- Try creating a task with today's date → Should succeed
- Try creating a task with tomorrow's date → Should succeed

---

## 2. Death Report Validation ✅

### Location
- **New File**: `backend/validators/deathValidators.js`
- **Updated File**: `backend/routes/DeathRegistration.js`
- **Endpoint**: `POST /api/death-registration`

### Changes Made
- Created new validator file for death certificates
- Added validation to prevent future death dates
- Integrated validator into death registration route

### Validation Logic
```javascript
.custom((value) => {
  const deathDate = new Date(value);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  
  if (deathDate > today) {
    throw new Error('Death date cannot be in the future. Please select a valid date.');
  }
  return true;
})
```

### Error Message
> "Death date cannot be in the future. Please select a valid date."

### Testing
- Try submitting death date as tomorrow → Should fail
- Try submitting death date as today → Should succeed
- Try submitting death date as yesterday → Should succeed

---

## 3. Birth Certificate Validation for Single Users ✅

### Location
- **File**: `backend/routes/BirthCertification.js`
- **Endpoint**: `POST /api/birth-certification`

### Changes Made
- Added marital status check before allowing child birth certificate application
- Blocks single users from applying for child birth certificates
- Provides helpful error message

### Validation Logic
```javascript
// Check if user is single
if (requester.marital_status === 'single') {
  return res.status(400).json({
    error: 'You are currently single and cannot apply for a child birth certificate. You can still apply for your own birth certificate.'
  });
}
```

### Error Message
> "You are currently single and cannot apply for a child birth certificate. You can still apply for your own birth certificate."

### Testing
- Single user tries to apply for child birth certificate → Should fail with message
- Married user tries to apply for child birth certificate → Should proceed to next validation

---

## 4. Marriage Duration Validation (18 Months Rule) ✅

### Location
- **File**: `backend/routes/BirthCertification.js`
- **Endpoint**: `POST /api/birth-certification`

### Changes Made
- Added marriage duration check after marital status validation
- Calculates months between marriage date and current date
- Requires minimum 18 months (1 year and 6 months) before allowing child birth certificate

### Validation Logic
```javascript
if (requester.marital_status === 'married') {
  // Get the marriage date from certificates table
  const [marriageCerts] = await pool.query(
    `SELECT marriage_date, approved_at 
     FROM certificates 
     WHERE resident_id = ? 
     AND certificate_type = 'marriage' 
     AND status = 'approved'
     ORDER BY approved_at DESC
     LIMIT 1`,
    [requester_id]
  );

  if (marriageCerts[0] && marriageCerts[0].marriage_date) {
    const marriageDate = new Date(marriageCerts[0].marriage_date);
    const today = new Date();
    
    // Calculate months difference
    const monthsDiff = (today.getFullYear() - marriageDate.getFullYear()) * 12 
                      + (today.getMonth() - marriageDate.getMonth());
    
    // Require at least 18 months
    if (monthsDiff < 18) {
      return res.status(400).json({
        error: 'You recently got married. Child birth certificate registration is available after at least 1 year and 6 months from the marriage date.'
      });
    }
  }
}
```

### Error Message
> "You recently got married. Child birth certificate registration is available after at least 1 year and 6 months from the marriage date."

### Testing
- User married 6 months ago tries to apply → Should fail
- User married 12 months ago tries to apply → Should fail
- User married 17 months ago tries to apply → Should fail
- User married 18 months ago tries to apply → Should succeed
- User married 24 months ago tries to apply → Should succeed

---

## Files Created/Modified

### New Files Created
1. `backend/validators/deathValidators.js` - Death certificate validation rules
2. `backend/validators/birthValidators.js` - Birth certificate validation rules

### Files Modified
1. `backend/validators/taskValidators.js` - Added date validation for task assignment
2. `backend/routes/DeathRegistration.js` - Integrated death date validator
3. `backend/routes/BirthCertification.js` - Added single user and marriage duration validations

---

## Database Fields Used

### Existing Fields (No Schema Changes Required)
- `residents.marital_status` - Used to check if user is single
- `certificates.marriage_date` - Used to calculate marriage duration
- `certificates.certificate_type` - Used to find marriage certificates
- `certificates.status` - Used to find approved marriages
- `tasks.due_date` - Validated for past dates

---

## Validation Flow Diagram

### Birth Certificate Application Flow
```
User submits birth certificate request
    ↓
1. Check if user is single
    ↓ (if single)
    ✗ Reject: "You are currently single..."
    ↓ (if married)
2. Check marriage duration
    ↓ (if < 18 months)
    ✗ Reject: "You recently got married..."
    ↓ (if ≥ 18 months)
3. Check if child exists
    ↓
4. Check if user is parent
    ↓
5. Create certificate request
    ↓
    ✓ Success
```

---

## Testing Checklist

### Task Assignment (Admin)
- [ ] Cannot assign task with past date
- [ ] Can assign task with today's date
- [ ] Can assign task with future date
- [ ] Error message displays correctly

### Death Registration
- [ ] Cannot register death with future date
- [ ] Can register death with today's date
- [ ] Can register death with past date
- [ ] Error message displays correctly

### Birth Certificate (Single User)
- [ ] Single user cannot apply for child birth certificate
- [ ] Error message displays correctly
- [ ] Single user can still apply for own birth certificate

### Birth Certificate (Marriage Duration)
- [ ] User married < 18 months cannot apply
- [ ] User married exactly 18 months can apply
- [ ] User married > 18 months can apply
- [ ] Error message displays correctly
- [ ] Validation only applies to married users

---

## Important Notes

1. **No Breaking Changes**: All existing functionality is preserved
2. **Database Compatibility**: No schema changes required
3. **Backward Compatible**: Existing API contracts maintained
4. **Error Handling**: All validations return appropriate HTTP status codes and messages
5. **Security**: All validations run server-side and cannot be bypassed

---

## API Response Examples

### Task Assignment - Past Date Error
```json
{
  "error": "Task date cannot be earlier than today. Please select today or a future date.",
  "errors": [...]
}
```

### Death Registration - Future Date Error
```json
{
  "error": "Death date cannot be in the future. Please select a valid date.",
  "errors": [...]
}
```

### Birth Certificate - Single User Error
```json
{
  "error": "You are currently single and cannot apply for a child birth certificate. You can still apply for your own birth certificate."
}
```

### Birth Certificate - Marriage Duration Error
```json
{
  "error": "You recently got married. Child birth certificate registration is available after at least 1 year and 6 months from the marriage date."
}
```

---

## Deployment Notes

1. No database migrations required
2. No environment variable changes needed
3. Restart backend server after deploying changes
4. Test all four validations in staging before production
5. Monitor error logs for any validation issues

---

## Support & Maintenance

If you need to modify these validations:

1. **Task date validation**: Edit `backend/validators/taskValidators.js`
2. **Death date validation**: Edit `backend/validators/deathValidators.js`
3. **Single user validation**: Edit `backend/routes/BirthCertification.js` (line ~45)
4. **Marriage duration**: Edit `backend/routes/BirthCertification.js` (line ~53)

To change the 18-month requirement, modify the comparison:
```javascript
if (monthsDiff < 18) { // Change 18 to desired months
```

---

**Implementation Date**: 2026-05-26
**Status**: ✅ Complete and Ready for Testing
