const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'utils', 'pdfGenerator.js');
let content = fs.readFileSync(filePath, 'utf8');

// First, add font registration logic to generateCertificate
const fontVars = `  const fontRegular = path.join(__dirname, '..', 'assets', 'fonts', 'NotoSansEthiopic-Regular.ttf');
  const fontBold = path.join(__dirname, '..', 'assets', 'fonts', 'NotoSansEthiopic-Bold.ttf');
  
  doc.registerFont('Amharic-Regular', fontRegular);
  doc.registerFont('Amharic-Bold', fontBold);
`;

content = content.replace('doc.pipe(writable);', 'doc.pipe(writable);\n\n' + fontVars);

// Replace Helvetica with Amharic
content = content.replace(/'Helvetica'/g, "'Amharic-Regular'");
content = content.replace(/'Helvetica-Bold'/g, "'Amharic-Bold'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fonts updated successfully');
