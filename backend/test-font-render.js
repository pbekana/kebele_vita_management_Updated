const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test-output.pdf'));

doc.registerFont('Ethiopic', 'assets/fonts/NotoSansEthiopic-Regular.ttf');
doc.font('Ethiopic').fontSize(12).text("English Text: Gemechu Daba");
doc.font('Ethiopic').text("Amharic Text: ጅማ");

doc.end();
