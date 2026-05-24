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
  birth_date: new Date('2020-01-01'),
  birthplace: 'Addis Ababa',
  marital_status: 'single',
  father_name: 'Bikila',
  mother_name: 'Almaz',
  phone_number: '0911234567',
  occupation: 'Student',
  education_level: 'primary',
  emergency_contact_name: 'Almaz',
  emergency_contact_phone: '0911234568',
  nationality: 'Ethiopian',
  religion: 'Orthodox',
  disability_status: false,
  photo_path: null,
  address: 'Kebele 01',
  house_number: '123',
  registration_date: new Date(),
  child_name: 'Abebe',
  birth_place: 'Addis Ababa'
};

const stream = fs.createWriteStream('./test_cert.pdf');
generateCertificate(cert, stream);

stream.on('finish', () => {
  console.log('PDF generated successfully');
});
