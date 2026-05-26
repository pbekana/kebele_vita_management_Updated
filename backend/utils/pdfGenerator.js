const PDFDocument = require('pdfkit');
const fs   = require('fs');
const path = require('path');
const { validateAndSanitize } = require('./certificateValidator');

// ─── Colour palette ────────────────────────────────────────────────────────
const C = {
  green:    '#078930',
  gold:     '#fcdd09',
  red:      '#da121a',
  white:    '#ffffff',
  navy:     '#1a237e',
  black:    '#000000',
  gray:     '#cccccc',
  darkGray: '#546e7a',
  lightBg:  '#f5f7ff',
  midGray:  '#90a4ae',
};

// ─── Page dimensions (A4) ──────────────────────────────────────────────────
const A4_W   = 595.28;
const A4_H   = 841.89;
const MARGIN = 30;
const CW     = A4_W - MARGIN * 2;         // usable content width
const FOOTER_H = 72;                       // reserved at bottom
const MAX_Y    = A4_H - FOOTER_H - 10;    // never render below this

// ─── Formatting helpers ────────────────────────────────────────────────────
function fmtDate(val) {
  if (!val || val === '—' || val === 'null' || val === 'undefined') return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function s(v) {
  if (v === null || v === undefined || v === '' || v === '—' || v === '-' || v === 'null' || v === 'undefined') return '-';
  return String(v);
}

// ─── Drawing primitives ────────────────────────────────────────────────────
function hline(doc, x, y, w, color = C.gray, lw = 0.5) {
  doc.moveTo(x, y).lineTo(x + w, y).lineWidth(lw).strokeColor(color).stroke();
}

function ensurePageSpace(doc, y, heightNeeded, data) {
  if (y + heightNeeded > MAX_Y) {
    doc.addPage();
    drawWatermark(doc);
    return drawHeader(doc, data);
  }
  return y;
}

function sectionBanner(doc, title, y, data) {
  y = ensurePageSpace(doc, y, 30, data);
  doc.rect(MARGIN, y, CW, 14).fill('#e8edf8');
  doc.font('Bold').fontSize(7.5).fillColor(C.navy)
     .text(title.toUpperCase(), MARGIN + 6, y + 3, { width: CW - 12, lineBreak: true });
  return y + 18;
}

// Two-column field row: label on left, value on right
function fieldRow(doc, label, value, x, y, labelW, fieldW, data) {
  const valStr = s(value);
  doc.font('Bold').fontSize(7).fillColor(C.navy);
  const labelHeight = doc.heightOfString(label + ':', { width: labelW, lineBreak: true });
  doc.text(label + ':', x, y, { width: labelW, lineBreak: true });

  doc.font('Regular').fontSize(7).fillColor(C.black);
  const valueHeight = doc.heightOfString(valStr, { width: fieldW - labelW - 4, lineBreak: true });
  doc.text(valStr, x + labelW + 4, y, { width: fieldW - labelW - 4, lineBreak: true });

  return Math.max(labelHeight, valueHeight) + 8;
}

// Two fields side by side
function doubleRow(doc, f1, v1, f2, v2, y, data) {
  const half = CW / 2 - 6;
  const lw   = half * 0.44;
  const leftHeight  = fieldRow(doc, f1, v1, MARGIN,           y, lw, half, data);
  const rightHeight = fieldRow(doc, f2, v2, MARGIN + half + 12, y, lw, half, data);
  return y + Math.max(leftHeight, rightHeight);
}

// ─── Image box ────────────────────────────────────────────────────────────
function imageBox(doc, x, y, w, h, photoPath, caption) {
  doc.rect(x, y, w, h).lineWidth(0.5).strokeColor(C.gray).stroke();
  let drawn = false;
  
  if (photoPath && photoPath !== 'null' && photoPath !== 'undefined' && photoPath !== '') {
    try {
      const abs = path.isAbsolute(photoPath)
        ? photoPath
        : path.join(__dirname, '..', photoPath);
      
      // Verify file exists before attempting to embed
      if (fs.existsSync(abs)) {
        doc.image(abs, x + 1, y + 1, { 
          width: w - 2, 
          height: h - 2, 
          cover: [w - 2, h - 2],
          fit: [w - 2, h - 2]
        });
        drawn = true;
      }
    } catch (err) {
      // Image loading failed, fall back to placeholder
      console.warn(`Failed to load image from ${photoPath}:`, err.message);
    }
  }
  
  if (!drawn) {
    // Render placeholder if no image available
    doc.font('Regular').fontSize(6).fillColor(C.darkGray)
       .text(`👤\n3×4\n${caption}`, x, y + h / 2 - 10, { width: w, align: 'center' });
  }
  return y + h + 2;
}

// ─── HEADER ───────────────────────────────────────────────────────────────
function drawHeader(doc, data) {
  const HH = 80;

  // Ethiopian flag stripe accent
  doc.rect(0, 0, A4_W, 5).fill(C.green);
  doc.rect(0, 5, A4_W, 5).fill(C.gold);
  doc.rect(0, 10, A4_W, 5).fill(C.red);

  // Header background
  doc.rect(0, 15, A4_W, HH - 15).fill('#0d1b3e');

  let hy = 20;
  doc.font('Bold').fontSize(9).fillColor(C.white)
     .text('FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA', MARGIN, hy, { width: CW, align: 'center' });
  hy += 11;
  doc.font('Regular').fontSize(7.5).fillColor('#93c5fd')
     .text('የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ', MARGIN, hy, { width: CW, align: 'center' });
  hy += 10;
  doc.font('Regular').fontSize(6.5).fillColor(C.midGray)
     .text('Oromia Region · Jimma Zone · Jimma Woreda · Heremata Mentina Kebele', MARGIN, hy, { width: CW, align: 'center' });
  hy += 9;
  doc.font('Regular').fontSize(6).fillColor(C.midGray)
     .text('ኦሮሚያ ክልል · ጅማ ዞን · ጅማ ወረዳ · ሔረማታ መንቲና ቀበሌ', MARGIN, hy, { width: CW, align: 'center' });
  hy += 9;

  const titleMap = {
    birth:          'BIRTH CERTIFICATE',
    death:          'DEATH CERTIFICATE',
    marriage:       'MARRIAGE CERTIFICATE',
    'residency-id': 'RESIDENT IDENTITY CARD',
    residency:      'RESIDENCY CERTIFICATE',
  };
  const amhTitle = {
    birth:          'የልደት ምስክር ወረቀት',
    death:          'የሞት ምስክር ወረቀት',
    marriage:       'የጋብቻ ምስክር ወረቀት',
    'residency-id': 'የቀበሌ ነዋሪ መታወቂያ',
    residency:      'የነዋሪነት ምስክር ወረቀት',
  };
  doc.font('Bold').fontSize(11).fillColor(C.gold)
     .text(titleMap[data.certificateType] || data.certificateType.toUpperCase(), MARGIN, hy, { width: CW, align: 'center' });
  hy += 13;
  doc.font('Regular').fontSize(7.5).fillColor(C.white)
     .text(amhTitle[data.certificateType] || '', MARGIN, hy, { width: CW, align: 'center' });

  // Certificate number badge
  const badgeY = HH - 2;
  doc.rect(0, badgeY, A4_W, 14).fill('#1e3a5f');
  doc.font('Bold').fontSize(7).fillColor(C.gold)
     .text(`Certificate No. / ቁጥር:  ${data.certificateNumber}`, MARGIN, badgeY + 3, { width: CW, align: 'center' });

  return HH + 14 + 6; // return starting Y for content
}

// ─── WATERMARK ────────────────────────────────────────────────────────────
function drawWatermark(doc) {
  doc.save();
  doc.rotate(-35, { origin: [A4_W / 2, A4_H / 2] });
  doc.font('Bold').fontSize(52).fillColor('#e0e7ff').fillOpacity(0.12)
     .text('OFFICIAL', 80, A4_H / 2 - 30, { width: A4_W - 160, align: 'center', characterSpacing: 8 });
  doc.fillOpacity(1);
  doc.restore();
}

// ─── FOOTER ───────────────────────────────────────────────────────────────
function drawFooter(doc, data) {
  const fy = A4_H - FOOTER_H;

  hline(doc, MARGIN, fy, CW, C.navy, 1);

  const sigW   = CW * 0.32;
  const stampW = 52;
  const gap    = (CW - sigW * 2 - stampW) / 2;
  const sig1X  = MARGIN;
  const stampX = MARGIN + sigW + gap;
  const sig2X  = stampX + stampW + gap;
  const lineY  = fy + 34;

  // Signature lines
  hline(doc, sig1X, lineY, sigW, C.darkGray, 0.7);
  doc.font('Bold').fontSize(6).fillColor(C.darkGray)
     .text('Registrar / ሬጅስትራር', sig1X, lineY + 3, { width: sigW, align: 'center' });

  // Stamp
  const cx = stampX + stampW / 2;
  const cy = fy + 26;
  doc.circle(cx, cy, stampW / 2 - 2).lineWidth(1).strokeColor(C.red).stroke();
  doc.circle(cx, cy, stampW / 2 - 6).lineWidth(0.5).strokeColor(C.red).stroke();
  doc.font('Bold').fontSize(5.5).fillColor(C.red)
     .text('OFFICIAL\nSTAMP\nማህተም', cx - 14, cy - 10, { width: 28, align: 'center' });

  hline(doc, sig2X, lineY, sigW, C.darkGray, 0.7);
  doc.font('Bold').fontSize(6).fillColor(C.darkGray)
     .text('Kebele Manager / ሥራ አስኪያጅ', sig2X, lineY + 3, { width: sigW, align: 'center' });

  // Issue date + warning
  doc.font('Regular').fontSize(5.5).fillColor(C.midGray)
     .text(`Issue Date: ${fmtDate(data.issueDate)}`, MARGIN, fy + 54, { width: CW / 2, align: 'left' });
  doc.font('Regular').fontSize(5.5).fillColor(C.midGray)
     .text(
       'This document is valid only with official stamp and authorised signatures.',
       MARGIN + CW / 2, fy + 54,
       { width: CW / 2, align: 'right' }
     );
}

// ════════════════════════════════════════════════════════════════════════════
// CERTIFICATE-SPECIFIC RENDERERS
// ════════════════════════════════════════════════════════════════════════════

// ── BIRTH ──────────────────────────────────────────────────────────────────
function renderBirth(doc, data, startY) {
  let y = startY;

  // Child photo + child details (two-column top)
  const photoW = 90, photoH = 110;
  const infoX  = MARGIN + photoW + 12;
  const infoW  = CW - photoW - 12;

  y = ensurePageSpace(doc, y, photoH + 28, data);
  imageBox(doc, MARGIN, y, photoW, photoH, data.childPhotoPath, 'Child / ልጅ');

  // Child info panel
  const lw = infoW * 0.42;
  let iy = y;
  const childRows = [
    ["Child's Full Name / የልጅ ሙሉ ስም", s(data.childName)],
    ['Gender / ጾታ',                     s(data.childGender || data.gender)],
    ['Date of Birth / ልደት ቀን',         fmtDate(data.childBirthDate)],
    ['Place of Birth / ልደት ቦታ',        s(data.childBirthplace)],
    ["Father's Name / አባት ስም",          s(data.fatherName)],
    ["Mother's Name / እናት ስም",          s(data.motherName)],
    ['Registration Date / ምዝገባ',        fmtDate(data.registrationDate)],
  ];
  childRows.forEach(([label, value]) => {
    if (iy > MAX_Y) return;
    doc.font('Bold').fontSize(7).fillColor(C.navy)
       .text(label + ':', infoX, iy, { width: lw, lineBreak: false, ellipsis: true });
    doc.font('Regular').fontSize(7).fillColor(C.black)
       .text(value, infoX + lw + 4, iy, { width: infoW - lw - 4, lineBreak: false, ellipsis: true });
    iy += 12;
  });

  y = Math.max(y + photoH, iy) + 10;
  hline(doc, MARGIN, y, CW, C.gray); y += 8;

  // Registrant (parent) info
  y = sectionBanner(doc, 'Registrant Information / ዘጋቢ መረጃ', y, data);
  y = doubleRow(doc, 'Full Name / ሙሉ ስም', s(data.fullName), 'Phone / ስልክ', s(data.phone), y, data);
  y = doubleRow(doc, 'Occupation / ሥራ', s(data.occupation), 'Address / አድራሻ', s(data.fullAddress || data.kebele), y, data);

  return y + 8;
}

// ── MARRIAGE ──────────────────────────────────────────────────────────────
function renderMarriage(doc, data, startY) {
  let y = startY;

  // Marriage event info
  y = sectionBanner(doc, 'Marriage Details / የጋብቻ ዝርዝር', y, data);

  const mRows = [
    ['Marriage Date / ጋብቻ ቀን',   fmtDate(data.marriageDate)],
    ['Marriage Place / ጋብቻ ቦታ',  s(data.marriagePlace)],
    ['Witness / ምስክር',            s(data.witnessName)],
    ['Registration Date / ምዝገባ',  fmtDate(data.registrationDate)],
  ];
  mRows.forEach(([label, val]) => {
    if (y > MAX_Y) return;
    const rowHeight = fieldRow(doc, label, val, MARGIN, y, CW * 0.35, CW, data);
    y += rowHeight;
  });

  y += 10;
  hline(doc, MARGIN, y, CW, C.navy, 0.8); y += 8;

  // Side-by-side: Husband | Wife
  const colW  = CW / 2 - 8;
  const col2X = MARGIN + colW + 16;

  // Column headers
  doc.rect(MARGIN, y, colW, 16).fill('#0d1b3e');
  doc.rect(col2X, y, colW, 16).fill('#6b21a8');
  doc.font('Bold').fontSize(8).fillColor(C.white)
     .text('HUSBAND / ባል', MARGIN, y + 4, { width: colW, align: 'center' });
  doc.font('Bold').fontSize(8).fillColor(C.white)
     .text('WIFE / ሚስት', col2X, y + 4, { width: colW, align: 'center' });
  y += 20;

  // Photos
  const photoH = 90;
  const photoW = 72;
  y = ensurePageSpace(doc, y, photoH + 30, data);
  imageBox(doc, MARGIN, y, photoW, photoH, data.husbandPhotoPath, 'ባል');
  imageBox(doc, col2X,  y, photoW, photoH, data.wifePhotoPath,    'ሚስት');

  // Details next to photos
  const hInfoX = MARGIN + photoW + 6;
  const hInfoW = colW - photoW - 6;
  const wInfoX = col2X  + photoW + 6;
  const wInfoW = colW   - photoW - 6;
  const lw = hInfoW * 0.44;

  let hy = y;
  let wy = y;

  const husbandFields = [
    ['Full Name / ስም',   s(data.husbandName)],
    ['Birth Date / ልደት', fmtDate(data.husbandBirthDate)],
    ['Birthplace / ቦታ',  s(data.husbandBirthPlace)],
    ['ID / ቁጥር',         s(data.certificateNumber)],
  ];
  const wifeFields = [
    ['Full Name / ስም',   s(data.wifeName)],
    ['Birth Date / ልደት', fmtDate(data.wifeBirthDate)],
    ['Birthplace / ቦታ',  s(data.wifeBirthPlace)],
    ['ID / ቁጥር',         s(data.certificateNumber)],
  ];

  husbandFields.forEach(([label, val]) => {
    const rowHeight = fieldRow(doc, label, val, hInfoX, hy, lw, hInfoW, data);
    hy += rowHeight;
  });

  const lw2 = wInfoW * 0.44;
  wifeFields.forEach(([label, val]) => {
    const rowHeight = fieldRow(doc, label, val, wInfoX, wy, lw2, wInfoW, data);
    wy += rowHeight;
  });

  y = Math.max(y + photoH, hy, wy) + 12;

  // Vertical divider between columns
  doc.moveTo(MARGIN + colW + 8, startY + 30)
     .lineTo(MARGIN + colW + 8, y - 4)
     .lineWidth(0.5).strokeColor(C.gray).stroke();

  hline(doc, MARGIN, y, CW, C.gray); y += 8;

  // Registrant
  y = sectionBanner(doc, 'Registered By / ዘጋቢ', y, data);
  y = doubleRow(doc, 'Name / ስም', s(data.fullName), 'Phone / ስልክ', s(data.phone), y, data);

  return y + 8;
}

// ── DEATH ────────────────────────────────────────────────────────────────
function renderDeath(doc, data, startY) {
  let y = startY;

  // Deceased photo + details side by side
  const photoW = 90, photoH = 110;
  const infoX  = MARGIN + photoW + 12;
  const infoW  = CW - photoW - 12;
  const lw     = infoW * 0.42;

  imageBox(doc, MARGIN, y, photoW, photoH, data.deceasedPhotoPath, 'Deceased / ሟቹ');

  let iy = y;
  const deceasedRows = [
    ['Deceased Name / ሟቹ ስም',         s(data.deceasedName || data.childName)],
    ['Date of Death / የሞት ቀን',        fmtDate(data.deathDate)],
    ['Place of Death / የሞት ቦታ',       s(data.deathPlace)],
    ['Cause of Death / የሞት ምክንያት',   s(data.causeOfDeath)],
    ['Manner of Death / ሁኔታ',         s(data.mannerOfDeath)],
    ['Registration Date / ምዝገባ',      fmtDate(data.registrationDate)],
  ];
  deceasedRows.forEach(([label, value]) => {
    const rowHeight = fieldRow(doc, label, value, infoX, iy, lw, infoW, data);
    iy += rowHeight;
  });

  y = Math.max(y + photoH, iy) + 10;
  hline(doc, MARGIN, y, CW, C.gray); y += 8;

  // Reporter / Registrant
  y = sectionBanner(doc, 'Reported By / ዘጋቢ', y, data);
  y = doubleRow(doc, 'Reporter Name / ዘጋቢ ስም', s(data.fullName), 'Phone / ስልክ', s(data.phone), y, data);
  y = doubleRow(doc, 'Occupation / ሥራ', s(data.occupation), 'Address / አድራሻ', s(data.fullAddress || data.kebele), y, data);

  return y + 8;
}

// ── RESIDENCY / ID ───────────────────────────────────────────────────────
function renderResidency(doc, data, startY) {
  let y = startY;

  // Photo + personal info side by side
  const photoW = 100, photoH = 126;
  const infoX  = MARGIN + photoW + 14;
  const infoW  = CW - photoW - 14;
  const lw     = infoW * 0.42;

  imageBox(doc, MARGIN, y, photoW, photoH, data.photoPath, 'Photo / ፎቶ');

  let iy = y;
  const personalRows = [
    ['Full Name / ሙሉ ስም',        s(data.fullName)],
    ['Gender / ጾታ',              s(data.gender)],
    ['Date of Birth / ልደት ቀን',  fmtDate(data.birthDate)],
    ['Birthplace / ትውልድ ቦታ',   s(data.birthPlace)],
    ['Nationality / ዜግነት',       s(data.nationality)],
    ['Religion / ሃይማኖት',        s(data.religion)],
    ['Marital Status / ጋብቻ',    s(data.maritalStatus)],
    ['Disability / አካል ጉዳት',    data.disabilityStatus ? 'Yes / አዎ' : 'No / የለም'],
  ];
  personalRows.forEach(([label, value]) => {
    const rowHeight = fieldRow(doc, label, value, infoX, iy, lw, infoW, data);
    iy += rowHeight;
  });

  y = Math.max(y + photoH, iy) + 10;
  hline(doc, MARGIN, y, CW, C.gray); y += 8;

  // Family info
  y = sectionBanner(doc, 'Family Information / የቤተሰብ መረጃ', y, data);
  y = doubleRow(doc, "Father's Name / አባት",      s(data.fatherName), "Mother's Name / እናት",  s(data.motherName), y, data);
  if (data.maritalStatus && data.maritalStatus.toLowerCase() === 'married') {
    const rowHeight = fieldRow(doc, 'Spouse Name / የትዳር አጋር', s(data.spouseName), MARGIN, y, CW * 0.35, CW, data);
    y += rowHeight + 2;
  }

  hline(doc, MARGIN, y, CW, C.gray); y += 8;

  // Address
  y = sectionBanner(doc, 'Address / አድራሻ', y, data);
  y = doubleRow(doc, 'Region / ክልል', s(data.region), 'Zone / ዞን', s(data.zone), y, data);
  y = doubleRow(doc, 'Woreda / ወረዳ', s(data.woreda), 'Kebele / ቀበሌ', s(data.kebele), y, data);
  y = doubleRow(doc, 'House No / ቤት ቁጥር', s(data.houseNumber), 'Full Address / አድራሻ', s(data.fullAddress), y, data);

  hline(doc, MARGIN, y, CW, C.gray); y += 8;

  // Work & Contact
  y = sectionBanner(doc, 'Contact & Work / ግንኙነት እና ሥራ', y, data);
  y = doubleRow(doc, 'Phone / ስልክ', s(data.phone), 'Occupation / ሥራ', s(data.occupation), y, data);
  y = doubleRow(doc, 'Education / ትምህርት', s(data.education), 'Emergency Contact / አደጋ', s(data.emergencyContact), y, data);

  hline(doc, MARGIN, y, CW, C.gray); y += 8;

  // Card validity
  y = sectionBanner(doc, 'Card Validity / የካርዱ ፀናነት', y, data);
  y = doubleRow(doc, 'Reg. Date / ምዝገባ', fmtDate(data.registrationDate), 'Issue Date / የተሰጠበት', fmtDate(data.issueDate), y, data);
  const expiryHeight = fieldRow(doc, 'Expiry Date / የሚያበቃበት', fmtDate(data.expiryDate), MARGIN, y, CW * 0.35, CW, data);
  y += expiryHeight;

  return y + 8;
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ════════════════════════════════════════════════════════════════════════════
const generateCertificate = (rawCert, writable) => {
  const data = validateAndSanitize(rawCert);

  const doc = new PDFDocument({
    size:   [A4_W, A4_H],
    margin: 0,
    info: {
      Title:   `${data.certificateType.toUpperCase()} — Heremata Mentina Kebele`,
      Author:  'Heremata Mentina Kebele Administration',
      Subject: data.certificateType,
    },
  });

  doc.pipe(writable);

  const fontDir      = path.join(__dirname, '..', 'assets', 'fonts');
  const fontRegular  = path.join(fontDir, 'NotoSansEthiopic-Regular.ttf');
  const fontBold     = path.join(fontDir, 'NotoSansEthiopic-Bold.ttf');
  doc.registerFont('Regular', fontRegular);
  doc.registerFont('Bold',    fontBold);

  drawWatermark(doc);
  const contentStartY = drawHeader(doc, data);

  let y = contentStartY;

  const type = data.certificateType;
  if      (type === 'birth')                             y = renderBirth(doc, data, y);
  else if (type === 'marriage')                          y = renderMarriage(doc, data, y);
  else if (type === 'death')                             y = renderDeath(doc, data, y);
  else if (type === 'residency-id' || type === 'residency') y = renderResidency(doc, data, y);

  drawFooter(doc, data);
  doc.end();
};

module.exports = { generateCertificate };
