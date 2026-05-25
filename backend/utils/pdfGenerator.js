const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { validateAndSanitize } = require('./certificateValidator');

// ─── Colour palette ────────────────────────────────────────────────────────
const C = {
  green:   '#078930', 
  white:   '#ffffff',
  navy:    '#1a237e', 
  black:   '#000000',
  gray:    '#cccccc', 
  red:     '#d32f2f', 
  darkGray:'#546e7a',
  lightBg: '#f5f5f5',
};

const A5_W = 419.53; 
const A5_H = 595.28; 
const MARGIN = 18;
const CONTENT_W = A5_W - MARGIN * 2;

// ─── Formatting Helpers ────────────────────────────────────────────────────
function fmtDate(val) {
  if (!val || val === '—' || val === '-' || val === 'N/A' || val === 'null' || val === 'undefined') return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function s(v) { 
  if (v === null || v === undefined || v === '' || v === '—' || v === '-' || v === 'N/A' || v === 'null' || v === 'undefined') return '';
  return v;
}

function sanitizeText(val) {
  if (!val) return '';
  let cleaned = String(val);
  cleaned = cleaned.replace(/[\u200B-\u200D\uFEFF]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ');
  return cleaned.trim();
}

// ─── Drawing Helpers ───────────────────────────────────────────────────────
function fieldRow(doc, label, value, x, y, labelW, totalW) {
  const valX = x + labelW + 2;
  const valW = totalW - labelW - 2;

  const cleanLabel = sanitizeText(label) + ':';
  const cleanVal = sanitizeText(s(value));

  doc.font('Amharic-Bold').fontSize(6.5).fillColor(C.navy)
     .text(cleanLabel, x, y, { width: labelW, lineBreak: false, ellipsis: true });

  doc.font('Amharic-Regular').fontSize(6.5).fillColor(C.black)
     .text(cleanVal, valX, y, { width: valW, lineBreak: false, ellipsis: true });
}

function sectionTitle(doc, title, x, y, w) {
  doc.moveTo(x, y + 10)
     .lineTo(x + w, y + 10)
     .lineWidth(0.8)
     .strokeColor(C.navy)
     .stroke();

  doc.font('Amharic-Bold').fontSize(7).fillColor(C.navy)
     .text(title.toUpperCase(), x, y, { width: w });

  return y + 14; 
}

function borderBox(doc, x, y, w, h) {
  doc.rect(x, y, w, h).lineWidth(0.5).strokeColor(C.gray).stroke();
}

// ─── Render Pipeline Components ────────────────────────────────────────────

function drawWatermark(doc) {
  doc.save();
  doc.rotate(-35, { origin: [A5_W / 2, A5_H / 2] });
  doc.font('Amharic-Bold')
     .fontSize(38)
     .fillColor('rgba(200,200,200,0.18)')
     .fillOpacity(0.18)
     .text('OFFICIAL DOCUMENT', -20, A5_H / 2 - 20, {
       width: A5_W + 40,
       align: 'center',
       characterSpacing: 4,
     });
  doc.fillOpacity(1);
  doc.restore();
}

function drawHeader(doc, data) {
  const hH = 72; 
  doc.rect(0, 0, A5_W, hH).fill(C.green);
  doc.moveTo(0, hH).lineTo(A5_W, hH).lineWidth(1.5).strokeColor('#005a20').stroke();

  let hy = 6;
  doc.font('Amharic-Bold').fontSize(8.5).fillColor(C.white)
     .text('FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA', MARGIN, hy, { width: CONTENT_W, align: 'center' });
  hy += 11;
  doc.font('Amharic-Regular').fontSize(7.5).fillColor(C.white)
     .text(' የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ', MARGIN, hy, { width: CONTENT_W, align: 'center' });
  hy += 10;

  const logoSize = 16;
  const logoX = MARGIN + (CONTENT_W / 2) - logoSize / 2 - 70;
  doc.circle(logoX + logoSize / 2, hy + logoSize / 2, logoSize / 2)
     .lineWidth(0.8).strokeColor(C.white).stroke();
  doc.font('Amharic-Regular').fontSize(4).fillColor(C.white)
     .text('LOGO', logoX, hy + logoSize / 2 - 2, { width: logoSize, align: 'center' });

  doc.font('Amharic-Regular').fontSize(6.2).fillColor(C.white)
     .text(
       'Oromia Region · Jimma Zone · Jimma Woreda · Heremata Mentina Kebele\n' +
       'ኦሮሚያ ክልል · ጅማ ዞን · ጅማ ወረዳ · ሔረማታ መንቲና ቀበሌ',
       logoX + logoSize + 4, hy + 2,
       { width: CONTENT_W - logoSize - 8, lineBreak: true }
     );
  hy += logoSize + 2;

  const titleMap = {
    birth:        'BIRTH CERTIFICATE / የልደት ምስክር ወረቀት',
    death:        'DEATH CERTIFICATE / የሞት ምስክር ወረቀት',
    marriage:     'MARRIAGE CERTIFICATE / የጋብቻ ምስክር ወረቀት',
    'residency-id': 'RESIDENT ID CARD / የቀበሌ ነዋሪ መታወቂያ ካርድ',
    residency:    'RESIDENCY CERTIFICATE / የነዋሪነት ምስክር ወረቀት',
  };
  const certTitle = titleMap[data.certificateType] || data.certificateType.toUpperCase();

  doc.font('Amharic-Bold').fontSize(8).fillColor('#ffeb3b')
     .text(certTitle, MARGIN, hy, { width: CONTENT_W, align: 'center' });
  hy += 11;

  doc.font('Amharic-Bold').fontSize(6.5).fillColor(C.white)
     .text(`Certificate No / ምስክር ወረቀት ቁጥር: ${data.certificateNumber}`, MARGIN, hy, { width: CONTENT_W, align: 'center' });
}

function drawImageBox(doc, x, startY, width, height, photoPath, label) {
  borderBox(doc, x, startY, width, height);
  let drawn = false;
  
  if (photoPath && photoPath !== '—' && photoPath !== 'null' && photoPath !== 'undefined') {
    const absPhoto = path.isAbsolute(photoPath) ? photoPath : path.join(__dirname, '..', photoPath);
    try {
      if (fs.existsSync(absPhoto)) {
        doc.image(absPhoto, x + 1, startY + 1, { width: width - 2, height: height - 2, cover: [width - 2, height - 2] });
        drawn = true;
      }
    } catch (_) {}
  }
  
  if (!drawn) {
    doc.font('Amharic-Regular').fontSize(6.5).fillColor(C.darkGray)
       .text(`👤\n3×4 Photo\n${label}`, x + 2, startY + height / 2 - 14, { width: width - 4, align: 'center' });
  }
}

// ─── Unified Schema Renderer ───────────────────────────────────────────────

const BASE_SCHEMA = [
  { type: 'section', title: 'Personal Information / የግል መረጃ' },
  { type: 'custom_photo_personal' }, 
  { type: 'section', title: 'Family Information / የቤተሰብ መረጃ' },
  { type: 'row', fields: [
    { label: "Father's Name / የአባት ስም", key: 'fatherName', ratio: 0.5 },
    { label: "Mother's Name / የእናት ስም", key: 'motherName', ratio: 0.5 }
  ]},
  { type: 'row', fields: [
    { label: 'Spouse Name / የትዳር አጋር ስም', key: 'spouseName', ratio: 1.0, condition: (d) => d.maritalStatus && d.maritalStatus.toLowerCase() === 'married' }
  ]},
  { type: 'section', title: 'Address / አድራሻ' },
  { type: 'row', fields: [
    { label: 'Region / ክልል', key: 'region', ratio: 0.5 },
    { label: 'Zone / ዞን', key: 'zone', ratio: 0.5 }
  ]},
  { type: 'row', fields: [
    { label: 'Woreda / ወረዳ', key: 'woreda', ratio: 0.5 },
    { label: 'Kebele / ቀበሌ', key: 'kebele', ratio: 0.5 }
  ]},
  { type: 'row', fields: [
    { label: 'House No / የቤት ቁጥር', key: 'houseNumber', ratio: 1.0 }
  ]},
  { type: 'row', fields: [
    { label: 'Full Address / ሙሉ አድራሻ', key: 'fullAddress', ratio: 1.0, condition: (d) => d.fullAddress }
  ]},
  { type: 'section', title: 'Contact & Work / ግንኙነት እና ሥራ' },
  { type: 'row', fields: [
    { label: 'Phone / ስልክ', key: 'phone', ratio: 0.5 },
    { label: 'Occupation / ሥራ', key: 'occupation', ratio: 0.5 }
  ]},
  { type: 'row', fields: [
    { label: 'Education / ትምህርት', key: 'education', ratio: 0.5 },
    { label: 'Emergency Contact / አደጋ ጊዜ ተጠሪ', key: 'emergencyContact', ratio: 0.5 }
  ]}
];

const SPECIFIC_SCHEMA = {
  'residency-id': [
    { type: 'section', title: 'Card Validity / የካርዱ ፀናነት' },
    { type: 'row', fields: [
      { label: 'Reg. Date / ምዝገባ', key: 'registrationDate', isDate: true, ratio: 0.33 },
      { label: 'Issue Date / የተሰጠበት', key: 'issueDate', isDate: true, ratio: 0.33 },
      { label: 'Expiry / ሚያበቃበት', key: 'expiryDate', isDate: true, ratio: 0.33 }
    ]}
  ],
  'residency': [
    { type: 'section', title: 'Certificate Details / የካርዱ ፀናነት' },
    { type: 'row', fields: [
      { label: 'Reg. Date / ምዝገባ', key: 'registrationDate', isDate: true, ratio: 0.33 },
      { label: 'Issue Date / የተሰጠበት', key: 'issueDate', isDate: true, ratio: 0.33 },
      { label: 'Expiry / ሚያበቃበት', key: 'expiryDate', isDate: true, ratio: 0.33 }
    ]}
  ],
  'death': [
    { type: 'custom_death_photo' },
    { type: 'section', title: 'Death Details / የሞት ዝርዝር' },
    { type: 'row', fields: [
      { label: 'Date of Death / የሞት ቀን', key: 'deathDate', isDate: true, ratio: 0.5 },
      { label: 'Place of Death / የሞት ቦታ', key: 'deathPlace', ratio: 0.5 }
    ]},
    { type: 'row', fields: [{ label: 'Cause of Death / የሞት ምክንያት', key: 'causeOfDeath', ratio: 1.0 }] },
    { type: 'row', fields: [{ label: 'Manner of Death / የሞት ሁኔታ', key: 'mannerOfDeath', ratio: 1.0 }] },
    { type: 'row', fields: [{ label: 'Reporter / ዘጋቢ', key: 'fullName', ratio: 1.0 }] }
  ],
  'birth': [
    { type: 'custom_birth_photo' },
    { type: 'section', title: 'Birth Details / የልደት ዝርዝር' },
    { type: 'row', fields: [
      { label: "Child's Name / የልጅ ስም", key: 'childName', ratio: 0.5 },
      { label: 'Date of Birth / ልደት ቀን', key: 'birthDate', isDate: true, ratio: 0.5 }
    ]},
    { type: 'row', fields: [
      { label: 'Birth Place / ልደት ቦታ', key: 'birthPlace', ratio: 0.5 },
      { label: "Father's Name / የአባት ስም", key: 'fatherName', ratio: 0.5 }
    ]},
    { type: 'row', fields: [{ label: "Mother's Name / የእናት ስም", key: 'motherName', ratio: 1.0 }] },
    { type: 'row', fields: [{ label: 'Registered By / ዘጋቢ', key: 'fullName', ratio: 1.0 }] }
  ],
  'marriage': [
    { type: 'custom_marriage_photo' },
    { type: 'section', title: 'Marriage Details / የጋብቻ ዝርዝር' },
    { type: 'row', fields: [
      { label: 'Husband / ባል', key: 'husbandName', ratio: 0.5 },
      { label: 'Wife / ሚስት', key: 'wifeName', ratio: 0.5 }
    ]},
    { type: 'row', fields: [
      { label: 'Marriage Date / ጋብቻ ቀን', key: 'marriageDate', isDate: true, ratio: 0.5 },
      { label: 'Marriage Place / ጋብቻ ቦታ', key: 'marriagePlace', ratio: 0.5 }
    ]},
    { type: 'row', fields: [{ label: 'Witness 1 / ምስክር 1', key: 'witnessName', ratio: 1.0 }] },
    { type: 'section', title: 'Partner Birth Details / የአጋር የልደት መረጃ', condition: (d) => d.husbandBirthDate || d.wifeBirthDate },
    { type: 'row', fields: [
      { label: 'Husband Birth Date / የባል የልደት ቀን', key: 'husbandBirthDate', isDate: true, ratio: 0.5 },
      { label: 'Wife Birth Date / የሚስት የልደት ቀን', key: 'wifeBirthDate', isDate: true, ratio: 0.5 }
    ], condition: (d) => d.husbandBirthDate || d.wifeBirthDate },
    { type: 'row', fields: [
      { label: 'Husband Birthplace / የባል የልደት ቦታ', key: 'husbandBirthPlace', ratio: 0.5 },
      { label: 'Wife Birthplace / የሚስት የልደት ቦታ', key: 'wifeBirthPlace', ratio: 0.5 }
    ], condition: (d) => d.husbandBirthDate || d.wifeBirthDate }
  ]
};

function drawSchemaFields(doc, schema, data, startY) {
  let y = startY;
  const gap = 10;

  for (const block of schema) {
    if (block.condition && !block.condition(data)) continue;

    if (block.type === 'section') {
      y = sectionTitle(doc, block.title, MARGIN, y, CONTENT_W);
    } else if (block.type === 'row') {
      const activeFields = block.fields.filter(f => !f.condition || f.condition(data));
      if (activeFields.length === 0) continue;
      
      let curX = MARGIN;
      for (const field of activeFields) {
        const fieldWidth = (CONTENT_W * field.ratio) - (activeFields.length > 1 ? 4 : 0);
        const labelW = fieldWidth * 0.46; // Ratio for label vs value
        let val = field.customVal ? field.customVal(data) : data[field.key];
        if (field.isDate) val = fmtDate(val);

        fieldRow(doc, field.label, val, curX, y, labelW, fieldWidth);
        curX += fieldWidth + 8;
      }
      y += gap;
    } else if (block.type === 'custom_photo_personal') {
      // ── Custom Photo & Personal Info Layout ──
      // Completely devoid of biometric / fingerprint boxes
      const photoColW = 78;
      const personalColX = MARGIN + photoColW + 6;
      const personalColW = CONTENT_W - photoColW - 6;
      const photoBoxH = 85;

      drawImageBox(doc, MARGIN, y, photoColW, photoBoxH, data.photoPath, 'ፎቶግራፍ');
      doc.font('Amharic-Regular').fontSize(5.5).fillColor(C.darkGray)
         .text('Photo / ፎቶ', MARGIN, y + photoBoxH + 1, { width: photoColW, align: 'center' });

      const lW = personalColW * 0.44; 
      let py = y;
      
      const pRows = [
        ['Full Name / ሙሉ ስም', data.fullName],
        ['Gender / ጾታ', data.gender],
        ['Date of Birth / ልደት ቀን', fmtDate(data.birthDate)],
        ['Birthplace / ትውልድ ቦታ', data.birthPlace],
        ['Nationality / ዜግነት', data.nationality],
        ['Religion / ሃይማኖት', data.religion],
        ['Marital Status / ጋብቻ', data.maritalStatus],
        ['Disability / አካል ጉዳት', data.disabilityStatus ? 'Yes / አዎ' : 'No / የለም'],
      ];

      pRows.forEach(([label, value]) => {
        fieldRow(doc, label, value, personalColX, py, lW, personalColW);
        py += gap;
      });

      y = Math.max(py, y + photoBoxH + 14);
      
      // Thin divider
      doc.moveTo(MARGIN, y).lineTo(A5_W - MARGIN, y).lineWidth(0.4).strokeColor(C.gray).stroke();
      y += 4;
    } else if (block.type === 'custom_birth_photo' || block.type === 'custom_death_photo') {
      const isDeath = block.type === 'custom_death_photo';
      y = sectionTitle(doc, isDeath ? 'Deceased Photo / የሞተው ፎቶ' : 'Child Photo / የልጅ ፎቶ', MARGIN, y, CONTENT_W);
      const boxW = 110;
      const boxH = 90;
      drawImageBox(doc, MARGIN, y, boxW, boxH, isDeath ? data.deceasedPhotoPath : data.childPhotoPath, isDeath ? 'የሞተው ፎቶ' : 'የልጅ ፎቶ');
      doc.font('Amharic-Regular').fontSize(5.5).fillColor(C.darkGray)
         .text(isDeath ? 'Deceased Photo / የሞተው ፎቶ' : 'Child Photo / የልጅ ፎቶ', MARGIN, y + boxH + 2, { width: boxW, align: 'center' });
      y += boxH + 14;
    } else if (block.type === 'custom_marriage_photo') {
      y = sectionTitle(doc, 'Couple Photos / የባልና ሚስት ፎቶ', MARGIN, y, CONTENT_W);
      const boxW = (CONTENT_W - 8) / 2;
      const boxH = 76;
      drawImageBox(doc, MARGIN, y, boxW, boxH, data.husbandPhotoPath, 'ባል');
      drawImageBox(doc, MARGIN + boxW + 8, y, boxW, boxH, data.wifePhotoPath, 'ሚስት');

      doc.font('Amharic-Regular').fontSize(5.5).fillColor(C.darkGray)
         .text('Husband / ባል', MARGIN, y + boxH + 2, { width: boxW, align: 'center' });
      doc.font('Amharic-Regular').fontSize(5.5).fillColor(C.darkGray)
         .text('Wife / ሚስት', MARGIN + boxW + 8, y + boxH + 2, { width: boxW, align: 'center' });
      y += boxH + 16;
    }
  }

  return y;
}

// ─── FOOTER ─────────────────────────────────────────────────────────────────
function drawFooter(doc) {
  const footerH = 58;
  const footerY = A5_H - footerH - 6;

  doc.moveTo(MARGIN, footerY)
     .lineTo(A5_W - MARGIN, footerY)
     .lineWidth(0.8).strokeColor(C.gray).stroke();

  const sigW   = CONTENT_W * 0.35;
  const stampW = CONTENT_W * 0.22;
  const sigRX  = MARGIN + sigW + stampW + (CONTENT_W - sigW * 2 - stampW) / 2;
  const stampX = MARGIN + sigW + (CONTENT_W - sigW * 2 - stampW) / 2;

  const sigLineY = footerY + 28;

  doc.moveTo(MARGIN, sigLineY).lineTo(MARGIN + sigW, sigLineY)
     .lineWidth(0.6).strokeColor(C.darkGray).stroke();
  doc.font('Amharic-Bold').fontSize(5.5).fillColor(C.darkGray)
     .text('Registrar Signature / ሬጅስትራር ፊርማ', MARGIN, sigLineY + 2, { width: sigW, align: 'center' });

  // Stamp circle (solid)
  const stampCX = stampX + stampW / 2;
  const stampCY = footerY + 22;
  doc.circle(stampCX, stampCY, stampW / 2 - 2)
     .lineWidth(0.8).strokeColor('#f44336').stroke();
  doc.font('Amharic-Bold').fontSize(4.5).fillColor('#f44336')
     .text('OFFICIAL\nSTAMP\nማህተም', stampCX - 14, stampCY - 9, { width: 28, align: 'center' });

  doc.moveTo(sigRX, sigLineY).lineTo(sigRX + sigW, sigLineY)
     .lineWidth(0.6).strokeColor(C.darkGray).stroke();
  doc.font('Amharic-Bold').fontSize(5.5).fillColor(C.darkGray)
     .text('Kebele Manager / ሥራ አስኪያጅ ፊርማ', sigRX, sigLineY + 2, { width: sigW, align: 'center' });

  const warnY = footerY + 42;
  doc.font('Amharic-Regular').fontSize(5).fillColor(C.darkGray)
     .text(
       'This certificate is valid only with official stamp and signature. / ' +
       'ይህ ምስክር ወረቀት የሚፀናው ኦፊሴላዊ ማህተም እና ፊርማዎች ሲኖሩት ብቻ ነው።',
       MARGIN, warnY,
       { width: CONTENT_W, align: 'center' }
     );
}

// ─── MAIN ENTRY POINT ────────────────────────────────────────────────────────
const generateCertificate = (rawCert, writable) => {
  // 1. Validate & Sanitize data against schema
  // This explicitly strips HTML, zero-width chars, and enforces required fields.
  const data = validateAndSanitize(rawCert);

  const doc = new PDFDocument({
    size:    [A5_W, A5_H],
    margin:  0,
    info: {
      Title:   `${data.certificateType.toUpperCase()} — Heremata Mentina Kebele`,
      Author:  'Heremata Mentina Kebele Administration',
      Subject: data.certificateType,
    },
  });

  doc.pipe(writable);

  const fontRegular = path.join(__dirname, '..', 'assets', 'fonts', 'NotoSansEthiopic-Regular.ttf');
  const fontBold = path.join(__dirname, '..', 'assets', 'fonts', 'NotoSansEthiopic-Bold.ttf');
  
  doc.registerFont('Amharic-Regular', fontRegular);
  doc.registerFont('Amharic-Bold', fontBold);

  drawWatermark(doc);
  drawHeader(doc, data);

  let curY = 78;

  // Render Base Schema Fields
  curY = drawSchemaFields(doc, BASE_SCHEMA, data, curY);

  // Render Certificate-Specific Fields
  const specificSchema = SPECIFIC_SCHEMA[data.certificateType];
  if (specificSchema) {
    curY = drawSchemaFields(doc, specificSchema, data, curY);
  }

  drawFooter(doc);
  doc.end();
};

module.exports = { generateCertificate };
