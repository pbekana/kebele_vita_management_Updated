const fs = require('fs');
const { generateCertificate } = require('./utils/pdfGenerator');

// Base resident data shared across all certificates
const baseResident = {
  resident_firstname: 'Abebe',
  resident_lastname: 'Bikila',
  gender: 'male',
  birth_date: new Date('1990-05-15'),
  birthplace: 'Addis Ababa',
  phone_number: '0911234567',
  occupation: 'Teacher',
  education_level: 'tertiary',
  emergency_contact_name: 'Almaz Getnet',
  emergency_contact_phone: '0911234568',
  nationality: 'Ethiopian',
  religion: 'Orthodox',
  disability_status: false,
  address: 'Kebele 01, Main Street',
  house_number: '123',
  registration_date: new Date('2024-01-15'),
};

// ==================== BIRTH CERTIFICATE ====================
const birthCert = {
  ...baseResident,
  certificate_type: 'birth',
  id: 101,
  requested_at: new Date(),
  status: 'approved',
  approved_at: new Date(),
  issue_date: new Date(),
  marital_status: 'married',
  father_name: 'Bikila Haile',
  mother_name: 'Almaz Getnet',
  photo_path: null,
  // Child info
  child_name: 'Yohannes Abebe',
  child_full_name: 'Yohannes Abebe',
  child_birth_date: new Date('2020-01-15'),
  child_birthplace: 'Addis Ababa',
  child_gender: 'male',
};

// ==================== MARRIAGE CERTIFICATE ====================
const marriageCert = {
  ...baseResident,
  certificate_type: 'marriage',
  id: 102,
  requested_at: new Date(),
  status: 'approved',
  approved_at: new Date(),
  issue_date: new Date(),
  marital_status: 'married',
  father_name: 'Bikila Haile',
  mother_name: 'Almaz Getnet',
  photo_path: null,
  // Marriage info
  husband_name: 'Abebe Bikila',
  wife_name: 'Marta Kebede',
  husband_birth_date: new Date('1990-05-15'),
  husband_birth_place: 'Addis Ababa',
  wife_birth_date: new Date('1992-03-20'),
  wife_birth_place: 'Dire Dawa',
  marriage_date: new Date('2018-06-10'),
  marriage_place: 'Addis Ababa',
  witness_name: 'Kebede Assefa',
};

// ==================== DEATH CERTIFICATE ====================
const deathCert = {
  ...baseResident,
  certificate_type: 'death',
  id: 103,
  requested_at: new Date(),
  status: 'approved',
  approved_at: new Date(),
  issue_date: new Date(),
  marital_status: 'married',
  father_name: 'Bikila Haile',
  mother_name: 'Almaz Getnet',
  photo_path: null,
  // Death info
  child_name: 'Kosmas Bikila',
  deceased_full_name: 'Kosmas Bikila',
  deceased_birth_date: new Date('1960-07-22'),
  death_date: new Date('2024-03-15'),
  death_place: 'Addis Ababa Hospital',
  cause_of_death: 'Natural causes',
};

// ==================== RESIDENCY ID CERTIFICATE ====================
const residencyIdCert = {
  ...baseResident,
  certificate_type: 'residency-id',
  id: 104,
  requested_at: new Date(),
  status: 'approved',
  approved_at: new Date(),
  issue_date: new Date(),
  marital_status: 'married',
  father_name: 'Bikila Haile',
  mother_name: 'Almaz Getnet',
  photo_path: null,
  spouse_id: 124,
  spouse_name: 'Marta Kebede',
};

// ==================== RESIDENCY CERTIFICATE ====================
const residencyCert = {
  ...baseResident,
  certificate_type: 'residency',
  id: 105,
  requested_at: new Date(),
  status: 'approved',
  approved_at: new Date(),
  issue_date: new Date(),
  marital_status: 'married',
  father_name: 'Bikila Haile',
  mother_name: 'Almaz Getnet',
  photo_path: null,
  spouse_id: 124,
  spouse_name: 'Marta Kebede',
};

// Test all certificate types
const certificates = [
  { cert: birthCert, filename: 'test_birth_cert.pdf', name: 'Birth Certificate' },
  { cert: marriageCert, filename: 'test_marriage_cert.pdf', name: 'Marriage Certificate' },
  { cert: deathCert, filename: 'test_death_cert.pdf', name: 'Death Certificate' },
  { cert: residencyIdCert, filename: 'test_residency_id_cert.pdf', name: 'Residency ID Certificate' },
  { cert: residencyCert, filename: 'test_residency_cert.pdf', name: 'Residency Certificate' },
];

let completed = 0;

certificates.forEach(({ cert, filename, name }) => {
  const stream = fs.createWriteStream(filename);
  generateCertificate(cert, stream);
  
  stream.on('finish', () => {
    console.log(`✓ ${name} generated successfully (${filename})`);
    completed++;
    if (completed === certificates.length) {
      console.log('\n✓ All certificate tests completed successfully!');
    }
  });

  stream.on('error', (err) => {
    console.error(`✗ ${name} generation failed:`, err.message);
  });
});
