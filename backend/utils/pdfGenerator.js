const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ─── Colour palette ────────────────────────────────────────────────────────
const C = {
  green:   '#078930', // Ethiopian green (header background)
  white:   '#ffffff',
  navy:    '#1a237e', // section titles
  black:   '#000000',
  gray:    '#cccccc', // borders
  red:     '#d32f2f', // expiry date accent
  darkGray:'#546e7a',
  lightBg: '#f5f5f5',
};

// A5 dimensions in points (1 mm = 2.8346 pt)
const A5_W = 419.53; // 148 mm
const A5_H = 595.28; // 210 mm
const MARGIN = 18;
const CONTENT_W = A5_W - MARGIN * 2;

// ─── Helper: format date as DD/MM/YYYY ─────────────────────────────────────
function fmtDate(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// ─── Helper: safe string ───────────────────────────────────────────────────
function s(v) { return v || '—'; }

// ─── Helper: generate certificate number ───────────────────────────────────
function certNumber(cert) {
  const typeMap = {
    birth:        'BIRTH',
    death:        'DEATH',
    marriage:     'MARR',
    'residency-id': 'ID',
    residency:    'RES',
  };
  const typeCode = typeMap[cert.certificate_type] || 'CERT';
  const year = new Date(cert.requested_at || Date.now()).getFullYear();
  const seq  = String(cert.id || 0).padStart(5, '0');
  return `KBL-${typeCode}-${year}-${seq}`;
}

// ─── Helper: draw a labelled field row ─────────────────────────────────────
function fieldRow(doc, label, value, x, y, labelW, totalW) {
  const valX = x + labelW + 2;
  const valW = totalW - labelW - 2;

  doc.font('Amharic-Bold').fontSize(6.5).fillColor(C.navy)
     .text(label, x, y, { width: labelW, lineBreak: false });

  doc.font('Amharic-Regular').fontSize(6.5).fillColor(C.black)
     .text(s(value), valX, y, { width: valW, lineBreak: false });
}

// ─── Helper: draw a section title bar ──────────────────────────────────────
function sectionTitle(doc, title, x, y, w) {
  // underline bar
  doc.moveTo(x, y + 10)
     .lineTo(x + w, y + 10)
     .lineWidth(0.8)
     .strokeColor(C.navy)
     .stroke();

  doc.font('Amharic-Bold').fontSize(7).fillColor(C.navy)
     .text(title.toUpperCase(), x, y, { width: w });

  return y + 14; // return next Y after section title
}

// ─── Helper: draw a light border box ───────────────────────────────────────
function borderBox(doc, x, y, w, h) {
  doc.rect(x, y, w, h).lineWidth(0.5).strokeColor(C.gray).stroke();
}

// ─── WATERMARK ─────────────────────────────────────────────────────────────
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

// ─── HEADER ─────────────────────────────────────────────────────────────────
function drawHeader(doc, cert) {
  const hH = 72; // header height

  // Green background block
  doc.rect(0, 0, A5_W, hH).fill(C.green);

  // Horizontal lines inside header for structure
  doc.moveTo(0, hH).lineTo(A5_W, hH).lineWidth(1.5).strokeColor('#005a20').stroke();

  let hy = 6;

  // Country name — English
  doc.font('Amharic-Bold').fontSize(8.5).fillColor(C.white)
     .text('FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA', MARGIN, hy, {
       width: CONTENT_W, align: 'center',
     });
  hy += 11;

  // Country name — Amharic
  doc.font('Amharic-Regular').fontSize(7.5).fillColor(C.white)
     .text(' የኢትዮጵያ ፌዴራላዊ ዴሞክራሲያዊ ሪፐብሊክ', MARGIN, hy, {
       width: CONTENT_W, align: 'center',
     });
  hy += 10;

  // Logo placeholder (small circle) + Kebele name side by side
  const logoSize = 16;
  const logoX = MARGIN + (CONTENT_W / 2) - logoSize / 2 - 70;
  doc.circle(logoX + logoSize / 2, hy + logoSize / 2, logoSize / 2)
     .lineWidth(0.8).strokeColor(C.white).stroke();
  doc.font('Amharic-Regular').fontSize(4).fillColor(C.white)
     .text('LOGO', logoX, hy + logoSize / 2 - 2, {
       width: logoSize, align: 'center',
     });

  // Kebele info next to logo
  doc.font('Amharic-Regular').fontSize(6.2).fillColor(C.white)
     .text(
       'Oromia Region · Jimma Zone · Jimma Woreda · Heremata Mentina Kebele\n' +
       'ኦሮሚያ ክልል · ጅማ ዞን · ጅማ ወረዳ · ሔረማታ መንቲና ቀበሌ',
       logoX + logoSize + 4, hy + 2,
       { width: CONTENT_W - logoSize - 8, lineBreak: true }
     );
  hy += logoSize + 2;

  // Certificate type title
  const titleMap = {
    birth:        'BIRTH CERTIFICATE / የልደት ምስክር ወረቀት',
    death:        'DEATH CERTIFICATE / የሞት ምስክር ወረቀት',
    marriage:     'MARRIAGE CERTIFICATE / የጋብቻ ምስክር ወረቀት',
    'residency-id': 'RESIDENT ID CARD / የቀበሌ ነዋሪ መታወቂያ ካርድ',
    residency:    'RESIDENCY CERTIFICATE / የነዋሪነት ምስክር ወረቀት',
  };
  const certTitle = titleMap[cert.certificate_type] || `${(cert.certificate_type || 'CERTIFICATE').toUpperCase()}`;

  doc.font('Amharic-Bold').fontSize(8).fillColor('#ffeb3b')
     .text(certTitle, MARGIN, hy, { width: CONTENT_W, align: 'center' });
  hy += 11;

  // Certificate number
  doc.font('Amharic-Bold').fontSize(6.5).fillColor(C.white)
     .text(`Certificate No / ምስክር ወረቀት ቁጥር: ${certNumber(cert)}`, MARGIN, hy, {
       width: CONTENT_W, align: 'center',
     });
}

// ─── PHOTO + PERSONAL INFO ──────────────────────────────────────────────────
function drawPhotoAndPersonal(doc, cert, startY) {
  const photoColW = 78;
  const personalColX = MARGIN + photoColW + 6;
  const personalColW = CONTENT_W - photoColW - 6;
  const photoBoxH = 85;
  const thumbH    = 38;

  // ── Photo box ──
  borderBox(doc, MARGIN, startY, photoColW, photoBoxH);

  if (cert.photo_path) {
    // Resolve photo path relative to backend root
    const absPhoto = path.isAbsolute(cert.photo_path)
      ? cert.photo_path
      : path.join(__dirname, '..', cert.photo_path);

    try {
      if (fs.existsSync(absPhoto)) {
        doc.image(absPhoto, MARGIN + 1, startY + 1, {
          width:  photoColW - 2,
          height: photoBoxH - 2,
          cover:  [photoColW - 2, photoBoxH - 2],
        });
      } else {
        drawPhotoPlaceholder(doc, MARGIN, startY, photoColW, photoBoxH);
      }
    } catch {
      drawPhotoPlaceholder(doc, MARGIN, startY, photoColW, photoBoxH);
    }
  } else {
    drawPhotoPlaceholder(doc, MARGIN, startY, photoColW, photoBoxH);
  }

  // Photo label underneath
  doc.font('Amharic-Regular').fontSize(5.5).fillColor(C.darkGray)
     .text('Photo / ፎቶ', MARGIN, startY + photoBoxH + 1, { width: photoColW, align: 'center' });

  // ── Right thumb fingerprint placeholder ──
  const thumbY = startY + photoBoxH + 10;
  doc.rect(MARGIN, thumbY, photoColW, thumbH)
     .lineWidth(0.5).dash(2, { space: 2 }).strokeColor(C.gray).stroke();
  doc.undash();
  doc.font('Amharic-Regular').fontSize(5).fillColor(C.darkGray)
     .text('Right Thumb / የቀኝ አውራ ጣት', MARGIN, thumbY + thumbH / 2 - 4, {
       width: photoColW, align: 'center',
     });

  // ── Personal info table ──
  const lW = personalColW * 0.44; // label width proportion
  let py = startY;
  const gap = 9.5;

  const rows = [
    ['Full Name / ሙሉ ስም',          `${s(cert.resident_firstname)} ${s(cert.resident_lastname)}`],
    ['Gender / ጾታ',                 s(cert.gender)],
    ['Date of Birth / ልደት ቀን',     fmtDate(cert.birth_date)],
    ['Birthplace / ትውልድ ቦታ',      s(cert.birthplace)],
    ['Nationality / ዜግነት',          s(cert.nationality || 'Ethiopian')],
    ['Religion / ሃይማኖት',            s(cert.religion)],
    ['Marital Status / ጋብቻ',        s(cert.marital_status)],
    ['Disability / አካል ጉዳት',       cert.disability_status ? 'Yes / አዎ' : 'No / የለም'],
  ];

  rows.forEach(([label, value]) => {
    fieldRow(doc, label, value, personalColX, py, lW, personalColW);
    py += gap;
  });

  // Return the bottom-most Y used by either column
  return Math.max(py, thumbY + thumbH + 4);
}

function drawPhotoPlaceholder(doc, x, startY, colW, boxH) {
  doc.font('Amharic-Regular').fontSize(6.5).fillColor(C.darkGray)
     .text('👤\n3×4 Photo\nፎቶግራፍ', x + 2, startY + boxH / 2 - 14, {
       width: colW - 4, align: 'center',
     });
}

function drawImageBox(doc, x, startY, width, height, photoPath) {
  borderBox(doc, x, startY, width, height);
  if (photoPath) {
    const absPhoto = path.isAbsolute(photoPath)
      ? photoPath
      : path.join(__dirname, '..', photoPath);

    try {
      if (fs.existsSync(absPhoto)) {
        doc.image(absPhoto, x + 1, startY + 1, {
          width: width - 2,
          height: height - 2,
          cover: [width - 2, height - 2],
        });
        return;
      }
    } catch (_) {}
  }
  drawPhotoPlaceholder(doc, x, startY, width, height);
}

function drawCertImageSection(doc, cert, y) {
  const type = cert.certificate_type;

  if (type === 'marriage') {
    y = sectionTitle(doc, 'Couple Photos / የባልና ሚስት ፎቶ', MARGIN, y, CONTENT_W);
    const boxW = (CONTENT_W - 8) / 2;
    const boxH = 76;
    drawImageBox(doc, MARGIN, y, boxW, boxH, cert.husband_photo_path);
    drawImageBox(doc, MARGIN + boxW + 8, y, boxW, boxH, cert.wife_photo_path);

    doc.font('Amharic-Regular').fontSize(5.5).fillColor(C.darkGray)
       .text('Husband / ባል', MARGIN, y + boxH + 2, { width: boxW, align: 'center' });
    doc.font('Amharic-Regular').fontSize(5.5).fillColor(C.darkGray)
       .text('Wife / ሚስት', MARGIN + boxW + 8, y + boxH + 2, { width: boxW, align: 'center' });
    return y + boxH + 16;
  }

  if (type === 'birth') {
    y = sectionTitle(doc, 'Child Photo / የልጅ ፎቶ', MARGIN, y, CONTENT_W);
    const boxW = 110;
    const boxH = 90;
    drawImageBox(doc, MARGIN, y, boxW, boxH, cert.child_photo_path);

    doc.font('Amharic-Regular').fontSize(5.5).fillColor(C.darkGray)
       .text('Child Photo / የልጅ ፎቶ', MARGIN, y + boxH + 2, { width: boxW, align: 'center' });
    return y + boxH + 14;
  }

  if (type === 'death') {
    y = sectionTitle(doc, 'Deceased Photo / የሞተው ፎቶ', MARGIN, y, CONTENT_W);
    const boxW = 110;
    const boxH = 90;
    drawImageBox(doc, MARGIN, y, boxW, boxH, cert.deceased_photo_path);

    doc.font('Amharic-Regular').fontSize(5.5).fillColor(C.darkGray)
       .text('Deceased Photo / የሞተው ፎቶ', MARGIN, y + boxH + 2, { width: boxW, align: 'center' });
    return y + boxH + 14;
  }

  return y;
}

// ─── FAMILY ─────────────────────────────────────────────────────────────────
function drawFamily(doc, cert, y) {
  y = sectionTitle(doc, 'Family Information / የቤተሰብ መረጃ', MARGIN, y, CONTENT_W);

  const colW = CONTENT_W / 2 - 4;
  const lW   = colW * 0.46;

  fieldRow(doc, "Father's Name / የአባት ስም", s(cert.father_name), MARGIN, y, lW, colW);
  fieldRow(doc, "Mother's Name / የእናት ስም", s(cert.mother_name), MARGIN + colW + 8, y, lW, colW);
  y += 10;

  if ((cert.marital_status || '').toLowerCase() === 'married' && cert.spouse_name) {
    fieldRow(doc, 'Spouse Name / የትዳር አጋር ስም', s(cert.spouse_name), MARGIN, y, lW * 0.7, CONTENT_W);
    y += 10;
  }

  return y;
}

// ─── ADDRESS ─────────────────────────────────────────────────────────────────
function drawAddress(doc, cert, y) {
  y = sectionTitle(doc, 'Address / አድራሻ', MARGIN, y, CONTENT_W);

  const colW = CONTENT_W / 2 - 4;
  const lW   = colW * 0.46;

  fieldRow(doc, 'Region / ክልል',   'Oromia / ኦሮሚያ', MARGIN,             y, lW, colW);
  fieldRow(doc, 'Zone / ዞን',      'Jimma / ጅማ',     MARGIN + colW + 8,  y, lW, colW);
  y += 10;

  fieldRow(doc, 'Woreda / ወረዳ',  'Jimma / ጅማ',     MARGIN,             y, lW, colW);
  fieldRow(doc, 'Kebele / ቀበሌ',  'Heremata Mentina / ሔረማታ መንቲና', MARGIN + colW + 8, y, lW, colW);
  y += 10;

  fieldRow(doc, 'House No / የቤት ቁጥር', s(cert.house_number), MARGIN, y, lW * 0.6, CONTENT_W);
  y += 10;

  if (cert.address) {
    fieldRow(doc, 'Full Address / ሙሉ አድራሻ', s(cert.address), MARGIN, y, lW * 0.6, CONTENT_W);
    y += 10;
  }

  return y;
}

// ─── CONTACT & WORK ─────────────────────────────────────────────────────────
function drawContact(doc, cert, y) {
  y = sectionTitle(doc, 'Contact & Work / ግንኙነት እና ሥራ', MARGIN, y, CONTENT_W);

  const colW = CONTENT_W / 2 - 4;
  const lW   = colW * 0.46;

  fieldRow(doc, 'Phone / ስልክ',              s(cert.phone_number),     MARGIN,             y, lW, colW);
  fieldRow(doc, 'Occupation / ሥራ',          s(cert.occupation),       MARGIN + colW + 8,  y, lW, colW);
  y += 10;

  fieldRow(doc, 'Education / ትምህርት',        s(cert.education_level),  MARGIN,             y, lW, colW);
  fieldRow(doc, 'Emergency Contact / አደጋ ጊዜ ተጠሪ',
    `${s(cert.emergency_contact_name)} (${s(cert.emergency_contact_phone)})`,
    MARGIN + colW + 8, y, lW, colW);
  y += 10;

  return y;
}

// ─── CERTIFICATE-SPECIFIC SECTION ───────────────────────────────────────────
function drawCertSpecific(doc, cert, y) {
  y = drawCertImageSection(doc, cert, y);
  const type = cert.certificate_type;

  if (type === 'residency-id' || type === 'residency') {
    y = sectionTitle(doc, 'Card Validity / የካርዱ ፀናነት', MARGIN, y, CONTENT_W);

    const issueDate  = cert.issue_date || cert.approved_at || new Date();
    const expiryDate = new Date(new Date(issueDate).getTime() + 3 * 365 * 24 * 60 * 60 * 1000);

    const colW = CONTENT_W / 3 - 4;
    const lW   = colW * 0.5;

    fieldRow(doc, 'Reg. Date / ምዝገባ',       fmtDate(cert.registration_date || cert.created_at), MARGIN,               y, lW, colW);
    fieldRow(doc, 'Issue Date / የተሰጠበት',    fmtDate(issueDate),                                 MARGIN + colW + 6,    y, lW, colW);
    fieldRow(doc, 'Expiry / ሚያበቃበት',       fmtDate(expiryDate),                                MARGIN + (colW+6)*2,  y, lW, colW);
    y += 10;

  } else if (type === 'death') {
    y = sectionTitle(doc, 'Death Details / የሞት ዝርዝር', MARGIN, y, CONTENT_W);

    const colW = CONTENT_W / 2 - 4;
    const lW   = colW * 0.46;

    fieldRow(doc, 'Date of Death / የሞት ቀን',  fmtDate(cert.death_date),    MARGIN,            y, lW, colW);
    fieldRow(doc, 'Place of Death / የሞት ቦታ', s(cert.death_place),         MARGIN + colW + 8, y, lW, colW);
    y += 10;

    fieldRow(doc, 'Cause of Death / የሞት ምክንያት', s(cert.cause_of_death), MARGIN, y, lW * 0.6, CONTENT_W);
    y += 10;

    fieldRow(doc, 'Manner of Death / የሞት ሁኔታ', s(cert.manner_of_death), MARGIN, y, lW * 0.6, CONTENT_W);
    y += 10;

    fieldRow(doc, 'Reporter / ዘጋቢ', s(cert.resident_firstname ? `${cert.resident_firstname} ${cert.resident_lastname}` : null), MARGIN, y, lW * 0.6, CONTENT_W);
    y += 10;

  } else if (type === 'birth') {
    y = sectionTitle(doc, 'Birth Details / የልደት ዝርዝር', MARGIN, y, CONTENT_W);

    const colW = CONTENT_W / 2 - 4;
    const lW   = colW * 0.46;

    fieldRow(doc, "Child's Name / የልጅ ስም",    s(cert.child_name),     MARGIN,            y, lW, colW);
    fieldRow(doc, 'Date of Birth / ልደት ቀን',   fmtDate(cert.birth_date), MARGIN + colW + 8, y, lW, colW);
    y += 10;

    fieldRow(doc, 'Birth Place / ልደት ቦታ',     s(cert.birth_place),    MARGIN,            y, lW, colW);
    fieldRow(doc, "Father's Name / የአባት ስም",  s(cert.father_name),    MARGIN + colW + 8, y, lW, colW);
    y += 10;

    fieldRow(doc, "Mother's Name / የእናት ስም",  s(cert.mother_name),    MARGIN, y, lW * 0.6, CONTENT_W);
    y += 10;

    fieldRow(doc, 'Registered By / ዘጋቢ',
      cert.resident_firstname ? `${cert.resident_firstname} ${cert.resident_lastname}` : '—',
      MARGIN, y, lW * 0.6, CONTENT_W);
    y += 10;

  } else if (type === 'marriage') {
    y = sectionTitle(doc, 'Marriage Details / የጋብቻ ዝርዝር', MARGIN, y, CONTENT_W);

    const colW = CONTENT_W / 2 - 4;
    const lW   = colW * 0.46;

    fieldRow(doc, "Husband / ባል",              s(cert.husband_name),     MARGIN,            y, lW, colW);
    fieldRow(doc, "Wife / ሚስት",               s(cert.wife_name),        MARGIN + colW + 8, y, lW, colW);
    y += 10;

    fieldRow(doc, 'Marriage Date / ጋብቻ ቀን',   fmtDate(cert.marriage_date), MARGIN,         y, lW, colW);
    fieldRow(doc, 'Marriage Place / ጋብቻ ቦታ',  s(cert.marriage_place),   MARGIN + colW + 8, y, lW, colW);
    y += 10;

    fieldRow(doc, 'Witness 1 / ምስክር 1', s(cert.witness_name), MARGIN, y, lW * 0.6, CONTENT_W);
    y += 10;

    if (cert.husband_birth_date || cert.husband_birth_place || cert.wife_birth_date || cert.wife_birth_place) {
      y = sectionTitle(doc, 'Partner Birth Details / የአጋር የልደት መረጃ', MARGIN, y, CONTENT_W);
      const detailColW = CONTENT_W / 2 - 4;
      const detailLW = detailColW * 0.46;

      fieldRow(doc, 'Husband Birth Date / የባል የልደት ቀን', fmtDate(cert.husband_birth_date), MARGIN, y, detailLW, detailColW);
      fieldRow(doc, 'Wife Birth Date / የሚስት የልደት ቀን', fmtDate(cert.wife_birth_date), MARGIN + detailColW + 8, y, detailLW, detailColW);
      y += 10;
      fieldRow(doc, 'Husband Birthplace / የባል የልደት ቦታ', s(cert.husband_birth_place), MARGIN, y, detailLW, detailColW);
      fieldRow(doc, 'Wife Birthplace / የሚስት የልደት ቦታ', s(cert.wife_birth_place), MARGIN + detailColW + 8, y, detailLW, detailColW);
      y += 10;
    }

  } else {
    // Generic / Support Letter / Residency
    y = sectionTitle(doc, 'Certificate Details / ዝርዝር', MARGIN, y, CONTENT_W);

    const colW = CONTENT_W / 2 - 4;
    const lW   = colW * 0.46;

    fieldRow(doc, 'Type / አይነት',        s(cert.certificate_type),     MARGIN,            y, lW, colW);
    fieldRow(doc, 'Issue Date / ቀን',    fmtDate(cert.issue_date || cert.approved_at), MARGIN + colW + 8, y, lW, colW);
    y += 10;

    if (cert.child_name) {
      fieldRow(doc, 'Name / ስም', s(cert.child_name), MARGIN, y, lW * 0.6, CONTENT_W);
      y += 10;
    }
  }

  return y;
}

// ─── FOOTER ─────────────────────────────────────────────────────────────────
function drawFooter(doc) {
  const footerH = 58;
  const footerY = A5_H - footerH - 6;

  // Divider line
  doc.moveTo(MARGIN, footerY)
     .lineTo(A5_W - MARGIN, footerY)
     .lineWidth(0.8).strokeColor(C.gray).stroke();

  // Three columns: registrar sig | stamp circle | manager sig
  const sigW   = CONTENT_W * 0.35;
  const stampW = CONTENT_W * 0.22;
  const sigRX  = MARGIN + sigW + stampW + (CONTENT_W - sigW * 2 - stampW) / 2;
  const stampX = MARGIN + sigW + (CONTENT_W - sigW * 2 - stampW) / 2;

  const sigLineY = footerY + 28;

  // Left signature line
  doc.moveTo(MARGIN, sigLineY).lineTo(MARGIN + sigW, sigLineY)
     .lineWidth(0.6).strokeColor(C.darkGray).stroke();
  doc.font('Amharic-Bold').fontSize(5.5).fillColor(C.darkGray)
     .text('Registrar Signature / ሬጅስትራር ፊርማ', MARGIN, sigLineY + 2, {
       width: sigW, align: 'center',
     });

  // Stamp circle (dashed)
  const stampCX = stampX + stampW / 2;
  const stampCY = footerY + 22;
  doc.circle(stampCX, stampCY, stampW / 2 - 2)
     .lineWidth(0.8).dash(2, { space: 2 }).strokeColor('#f44336').stroke();
  doc.undash();
  doc.font('Amharic-Bold').fontSize(4.5).fillColor('#f44336')
     .text('OFFICIAL\nSTAMP\nማህተም', stampCX - 14, stampCY - 9, { width: 28, align: 'center' });

  // Right signature line
  doc.moveTo(sigRX, sigLineY).lineTo(sigRX + sigW, sigLineY)
     .lineWidth(0.6).strokeColor(C.darkGray).stroke();
  doc.font('Amharic-Bold').fontSize(5.5).fillColor(C.darkGray)
     .text('Kebele Manager / ሥራ አስኪያጅ ፊርማ', sigRX, sigLineY + 2, {
       width: sigW, align: 'center',
     });

  // Warning text
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
/**
 * Streams an A5 certificate PDF into the given writable stream.
 *
 * @param {object} cert  - certificate + full resident fields merged into one object.
 *   Required fields:
 *     certificate_type, id, requested_at, status, approved_at, issue_date,
 *     resident_firstname, resident_lastname, gender, birth_date, birthplace,
 *     marital_status, father_name, mother_name, spouse_name (optional),
 *     phone_number, occupation, education_level,
 *     emergency_contact_name, emergency_contact_phone,
 *     nationality, religion, disability_status, photo_path,
 *     address, house_number, registration_date,
 *     + type-specific fields (child_name, death_date, etc.)
 * @param {Writable} writable - Node.js writable stream (HTTP response or file stream)
 */
const generateCertificate = (cert, writable) => {
  const doc = new PDFDocument({
    size:    [A5_W, A5_H],
    margin:  0,
    info: {
      Title:   `${(cert.certificate_type || 'Certificate').toUpperCase()} — Heremata Mentina Kebele`,
      Author:  'Heremata Mentina Kebele Administration',
      Subject: cert.certificate_type,
    },
  });

  doc.pipe(writable);

  const fontRegular = path.join(__dirname, '..', 'assets', 'fonts', 'NotoSansEthiopic-Regular.ttf');
  const fontBold = path.join(__dirname, '..', 'assets', 'fonts', 'NotoSansEthiopic-Bold.ttf');
  
  doc.registerFont('Amharic-Regular', fontRegular);
  doc.registerFont('Amharic-Bold', fontBold);


  // ── Watermark (drawn first, behind everything) ──
  drawWatermark(doc);

  // ── Header ──
  drawHeader(doc, cert);

  // ── Body content ──
  let curY = 78; // just below header

  // Photo + personal info
  curY = drawPhotoAndPersonal(doc, cert, curY) + 4;

  // Thin divider
  doc.moveTo(MARGIN, curY).lineTo(A5_W - MARGIN, curY)
     .lineWidth(0.4).strokeColor(C.gray).stroke();
  curY += 4;

  // Family
  curY = drawFamily(doc, cert, curY) + 2;

  // Address
  curY = drawAddress(doc, cert, curY) + 2;

  // Contact & Work
  curY = drawContact(doc, cert, curY) + 2;

  // Certificate-specific section
  curY = drawCertSpecific(doc, cert, curY) + 2;

  // ── Footer ──
  drawFooter(doc);

  doc.end();
};

module.exports = { generateCertificate };
