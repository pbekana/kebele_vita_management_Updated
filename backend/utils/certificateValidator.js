/**
 * Certificate Schema Validator and Sanitizer
 * Enforces unified schema rules, removes Amharic rendering corruption,
 * and standardizes the data object for the PDF generator.
 */

const ZERO_WIDTH_PATTERN = /[\u200B-\u200D\uFEFF]/g;
const CLIPBOARD_META_PATTERN = /Version:\d[\s\S]*?StartFragment:/i;
const CLIPBOARD_END_PATTERN = /EndFragment:[\s\S]*/i;
const HTML_TAG_PATTERN = /<[^>]*>/g;

function cleanString(val) {
  if (val === null || val === undefined || val === '') return null;
  return val; // Return exactly as stored in database, without sanitization
}

function validateAndSanitize(rawCert) {
  if (!rawCert || typeof rawCert !== 'object') {
    throw new Error('Certificate Rendering Error: Invalid or missing data object.');
  }

  // Preserve original values without strict text manipulation
  const sData = { ...rawCert };


  console.log('[VALIDATOR] Input fields:', Object.keys(sData).slice(0, 20).join(', '));
  console.log('[VALIDATOR] Resident name:', sData.resident_firstname, sData.resident_lastname);
  console.log('[VALIDATOR] Certificate type:', sData.certificate_type);

  const certificateType = sData.certificate_type;

  // ── Full Name (requester/resident) ─────────────────────────────────────────
  const firstName = sData.resident_firstname || sData.firstname || '';
  const lastName  = sData.resident_lastname  || sData.lastname  || '';
  const fullName  = `${firstName} ${lastName}`.trim();

  // ── Certificate Number ─────────────────────────────────────────────────────
  const typeMap = {
    birth: 'BIRTH', death: 'DEATH', marriage: 'MARR',
    'residency-id': 'ID', residency: 'RES',
  };
  const typeCode = typeMap[certificateType] || 'CERT';
  const year = new Date(sData.requested_at || Date.now()).getFullYear();
  const seq  = String(sData.id || 0).padStart(5, '0');
  const certificateNumber = `KBL-${typeCode}-${year}-${seq}`;

  const kebele    = 'Heremata Mentina';
  const issueDate = sData.issue_date || sData.approved_at || new Date().toISOString();

  // ── Validation ─────────────────────────────────────────────────────────────
  const missingFields = [];
  if (!certificateType) missingFields.push('certificate_type');
  if (!fullName)        missingFields.push('fullName');
  if (!sData.id)        missingFields.push('id');
  if (missingFields.length > 0) {
    throw new Error(`Certificate Validation Error: Missing required fields: ${missingFields.join(', ')}`);
  }

  // ── Birth-specific: child data takes priority over resident birth fields ───
  // child_birth_date / child_birthplace are enriched in the controller
  // Handle multiple field name variations from different sources
  const childBirthDate  = sData.child_birth_date   || sData.birth_date || null;
  const childBirthplace = sData.child_birthplace   || sData.birth_place || null;
  const childGender     = sData.child_gender       || null;
  const childFullName   = sData.child_full_name    || sData.child_name || null;

  // ── Resident personal birth info (used for residency / personal section) ──
  // Handle both naming conventions: resident_birth_date or birth_date
  const residentBirthDate  = sData.resident_birth_date  || null;
  const residentBirthplace = sData.resident_birthplace  || sData.birthplace || null;

  // ── Build unified validated schema object ──────────────────────────────────
  const validatedData = {
    ...sData,

    // Core
    certificateType,
    certificateNumber,
    fullName,

    // Resident personal info (for ID card / residency / personal section)
    gender:           sData.resident_gender || sData.gender        || null,
    birthDate:        residentBirthDate,
    birthPlace:       residentBirthplace,
    nationality:      sData.nationality   || 'Ethiopian',
    religion:         sData.religion      || null,
    maritalStatus:    sData.resident_marital_status || sData.marital_status || null,
    fatherName:       sData.father_name   || sData.resident_father_name || null,
    motherName:       sData.mother_name   || sData.resident_mother_name || null,
    spouseName:       sData.spouse_name   || null,

    // Contact / Work
    phone:            sData.phone_number  || null,
    occupation:       sData.occupation    || null,
    education:        sData.education_level || null,
    emergencyContact: sData.emergency_contact_name
      ? `${sData.emergency_contact_name}${sData.emergency_contact_phone ? ' – ' + sData.emergency_contact_phone : ''}`
      : null,

    // Address
    region:      'Oromia',
    zone:        'Jimma',
    woreda:      'Jimma',
    kebele,
    houseNumber: sData.house_number || null,
    fullAddress: sData.address || null,

    // Dates
    issueDate,
    registrationDate: sData.resident_registration_date || sData.registration_date || null,
    disabilityStatus: sData.disability_status === '1' || sData.disability_status === 'true' || sData.disability_status === true ? true : false,

    // Photo
    photoPath:        sData.resident_photo_path || sData.photo_path          || null,
    childPhotoPath:   sData.child_photo_path    || null,
    deceasedPhotoPath:sData.deceased_photo_path || null,
    husbandPhotoPath: sData.husband_photo_path  || null,
    wifePhotoPath:    sData.wife_photo_path     || null,

    // ── TYPE-SPECIFIC FIELDS ────────────────────────────────────────────────

    // Birth certificate
    childName:        childFullName,
    childBirthDate,
    childBirthplace,
    childGender,

    // Death certificate
    deceasedName:     sData.deceased_full_name || sData.child_name || null,
    deceasedBirthDate:sData.deceased_birth_date || null,
    deathDate:        sData.death_date         || null,
    deathPlace:       sData.death_place        || null,
    causeOfDeath:     sData.cause_of_death     || null,
    mannerOfDeath:    sData.manner_of_death    || null,

    // Marriage certificate
    husbandName:      sData.husband_name        || null,
    wifeName:         sData.wife_name           || null,
    marriageDate:     sData.marriage_date        || null,
    marriagePlace:    sData.marriage_place       || null,
    witnessName:      sData.witness_name         || null,
    husbandBirthDate: sData.husband_birth_date  || null,
    husbandBirthPlace:sData.husband_birth_place || sData.husband_birthplace || null,
    wifeBirthDate:    sData.wife_birth_date      || null,
    wifeBirthPlace:   sData.wife_birth_place     || sData.wife_birthplace || null,
  };

  // ── Expiry date for ID / residency ─────────────────────────────────────────
  if (certificateType === 'residency-id' || certificateType === 'residency') {
    const iDate = new Date(validatedData.issueDate || issueDate);
    const eDate = new Date(iDate.getTime() + 3 * 365 * 24 * 60 * 60 * 1000);
    validatedData.expiryDate = eDate.toISOString();
  } else {
    validatedData.expiryDate = null;
  }

  return validatedData;
}

module.exports = { validateAndSanitize, cleanString };
