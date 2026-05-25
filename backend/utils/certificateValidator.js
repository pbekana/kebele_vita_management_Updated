/**
 * Certificate Schema Validator and Sanitizer
 * Enforces unified schema rules, removes Amharic rendering corruption,
 * and standardizes the data object for the PDF generator.
 */

// Zero-width characters that cause rendering corruption (especially with Amharic)
const ZERO_WIDTH_PATTERN = /[\u200B-\u200D\uFEFF]/g;
// Clipboard HTML metadata
const CLIPBOARD_META_PATTERN = /Version:\d[\s\S]*?StartFragment:/i;
const CLIPBOARD_END_PATTERN = /EndFragment:[\s\S]*/i;
// Any HTML tags
const HTML_TAG_PATTERN = /<[^>]*>/g;

/**
 * Clean a single string value
 */
function cleanString(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val !== 'string') return String(val);

  let cleaned = val;
  // 1. Strip zero-width characters
  cleaned = cleaned.replace(ZERO_WIDTH_PATTERN, '');
  // 2. Strip Windows clipboard metadata
  cleaned = cleaned.replace(CLIPBOARD_META_PATTERN, '');
  cleaned = cleaned.replace(CLIPBOARD_END_PATTERN, '');
  // 3. Strip stray HTML tags
  cleaned = cleaned.replace(HTML_TAG_PATTERN, '');
  // 4. Normalize whitespace (collapse multiple spaces/newlines to a single space)
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned || null;
}

/**
 * Validates and sanitizes raw certificate data against the unified schema.
 * Throws an error if required fields are missing.
 * Returns a standardized, sanitized object ready for rendering.
 */
function validateAndSanitize(rawCert) {
  if (!rawCert || typeof rawCert !== 'object') {
    throw new Error('Certificate Rendering Error: Invalid or missing data object.');
  }

  // Sanitize all values
  const sData = {};
  for (const key in rawCert) {
    if (Object.prototype.hasOwnProperty.call(rawCert, key)) {
      sData[key] = cleanString(rawCert[key]);
    }
  }

  // Re-map essential fields for the unified schema
  const certificateType = sData.certificate_type;
  
  // Construct Full Name
  const firstName = sData.resident_firstname || sData.firstname || '';
  const lastName = sData.resident_lastname || sData.lastname || '';
  const fullName = `${firstName} ${lastName}`.trim();

  // Construct Certificate Number
  const typeMap = {
    birth: 'BIRTH',
    death: 'DEATH',
    marriage: 'MARR',
    'residency-id': 'ID',
    residency: 'RES',
  };
  const typeCode = typeMap[certificateType] || 'CERT';
  const year = new Date(sData.requested_at || Date.now()).getFullYear();
  const seq = String(sData.id || 0).padStart(5, '0');
  const certificateNumber = `KBL-${typeCode}-${year}-${seq}`;

  // Kebele (Usually fixed for this specific system, or passed from user profile)
  const kebele = 'Heremata Mentina'; // Hardcoded in current system logic

  const issueDate = sData.issue_date || sData.approved_at || new Date().toISOString();

  // 1. Validation Requirements
  const missingFields = [];
  if (!certificateType) missingFields.push('certificate_type');
  if (!fullName) missingFields.push('fullName (resident_firstname/lastname)');
  if (!sData.id) missingFields.push('id (certificate ID)');
  // address.kebele is implicitly "Heremata Mentina" in this app, but we ensure it's tracked
  
  if (missingFields.length > 0) {
    throw new Error(`Certificate Validation Error: Missing required fields: ${missingFields.join(', ')}`);
  }

  // 2. Build the unified validated schema object
  const fieldMap = {
    full_name: "fullName",
    gender: "gender",
    birth_date: "birthDate",
    birth_place: "birthPlace",
    nationality: "nationality",
    religion: "religion",
    marital_status: "maritalStatus",
    father_name: "fatherName",
    mother_name: "motherName",
    spouse_name: "spouseName",
    phone: "phone",
    occupation: "occupation",
    education: "education",
    emergency_contact: "emergencyContact",
    region: "region",
    zone: "zone",
    woreda: "woreda",
    kebele: "kebele",
    house_number: "houseNumber",
    issue_date: "issueDate",
    expiry_date: "expiryDate"
  };

  const validatedData = {
    ...sData, // Keep all sanitized original fields for specific mappings
    
    // Explicit Unified Base Fields
    certificateType,
    certificateNumber,
    fullName: fullName,
    
    // Default fallback values before applying explicit mapping
    nationality: 'Ethiopian',
    kebele: kebele,
    issueDate,
    disabilityStatus: sData.disability_status === '1' || sData.disability_status === 'true' ? true : false,
    
    // Type-specific fields (already sanitized)
    childName: sData.child_name || null,
    deathDate: sData.death_date || null,
    deathPlace: sData.death_place || null,
    causeOfDeath: sData.cause_of_death || null,
    mannerOfDeath: sData.manner_of_death || null,
    husbandName: sData.husband_name || null,
    wifeName: sData.wife_name || null,
    marriageDate: sData.marriage_date || null,
    marriagePlace: sData.marriage_place || null,
    witnessName: sData.witness_name || null,
    
    // Partner details
    husbandBirthDate: sData.husband_birth_date || null,
    husbandBirthPlace: sData.husband_birth_place || null,
    wifeBirthDate: sData.wife_birth_date || null,
    wifeBirthPlace: sData.wife_birth_place || null,

    // Photos
    photoPath: sData.photo_path || null,
    childPhotoPath: sData.child_photo_path || null,
    deceasedPhotoPath: sData.deceased_photo_path || null,
    husbandPhotoPath: sData.husband_photo_path || null,
    wifePhotoPath: sData.wife_photo_path || null
  };

  // Map explicitly requested DB keys to schema keys
  for (const [dbKey, schemaKey] of Object.entries(fieldMap)) {
    if (sData[dbKey] !== undefined && sData[dbKey] !== null) {
      validatedData[schemaKey] = sData[dbKey];
    }
  }

  // Add Expiry Date explicitly for ID/Residency
  if (certificateType === 'residency-id' || certificateType === 'residency') {
    const iDate = new Date(validatedData.issueDate || issueDate);
    const eDate = new Date(iDate.getTime() + 3 * 365 * 24 * 60 * 60 * 1000);
    validatedData.expiryDate = eDate.toISOString();
  } else {
    validatedData.expiryDate = null;
  }

  return validatedData;
}

module.exports = {
  validateAndSanitize,
  cleanString
};
