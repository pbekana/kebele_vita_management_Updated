const fs = require('fs');
const { generateCertificate } = require('./utils/pdfGenerator');

const cert = {
  certificate_type: 'birth',
  id: 123,
  requested_at: new Date(),
  status: 'approved',
  approved_at: new Date(),
  issue_date: new Date(),
  resident_firstname: 'Abebe',
  resident_lastname: 'Bikila',
  gender: 'male',
  birth_date: new Date('1990-05-15'),
  birthplace: 'Addis Ababa',
  marital_status: 'married',
  father_name: 'Bikila Haile',
  mother_name: 'Almaz Getnet',
  phone_number: '0911234567',
  occupation: 'Teacher',
  education_level: 'tertiary',
  emergency_contact_name: 'Almaz Getnet',
  emergency_contact_phone: '0911234568',
  nationality: 'Ethiopian',
  religion: 'Orthodox',
  disability_status: false,
  photo_path: null,
  address: 'Kebele 01, Main Street',
  house_number: '123',
  registration_date: new Date('2024-01-15'),
  // Child info
  child_name: 'Yohannes Abebe',
  child_full_name: 'Yohannes Abebe',
  child_birth_date: new Date('2020-01-15'),
  child_birthplace: 'Addis Ababa',
  child_gender: 'male',
  // Residency info
  spouse_id: 124,
  spouse_name: 'Marta Kebede'
};

const stream = fs.createWriteStream('./test_cert.pdf');
generateCertificate(cert, stream);

stream.on('finish', () => {
  console.log('PDF generated successfully');
});
