const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test-output3.pdf'));

doc.registerFont('Noto', 'test-noto-reg.ttf');
doc.font('Noto').fontSize(12).text("English Text: Gemechu Daba");
doc.font('Noto').text("Amharic Text: ጅማ");

doc.end();
