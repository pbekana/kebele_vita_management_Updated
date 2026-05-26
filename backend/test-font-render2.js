const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test-output2.pdf'));

doc.registerFont('SIL', 'test-font.ttf');
doc.font('SIL').fontSize(12).text("English Text: Gemechu Daba");
doc.font('SIL').text("Amharic Text: ጅማ");

doc.end();
