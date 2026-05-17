const PDFDocument = require('pdfkit');

/**
 * Streams a certificate PDF into the given writable (res or file stream).
 * @param {object} cert  - certificate row (with resident_name, certificate_type, issue_date, id)
 * @param {object} writable - Node.js writable stream (e.g. res)
 */
const generateCertificate = (cert, writable) => {
  const doc = new PDFDocument({ size: 'A4', margin: 60 });
  doc.pipe(writable);

  // ── Header ──────────────────────────────────────────────
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('FEDERAL DEMOCRATIC REPUBLIC OF ETHIOPIA', { align: 'center' });

  doc
    .fontSize(16)
    .font('Helvetica')
    .text('Heremata Mentina Kebele Administration', { align: 'center' });

  doc.moveDown(0.5);
  doc
    .moveTo(60, doc.y).lineTo(535, doc.y)
    .strokeColor('#2c5f8a').lineWidth(2).stroke();
  doc.moveDown(1);

  // ── Title ────────────────────────────────────────────────
  const typeLabel = cert.certificate_type.toUpperCase();
  doc
    .fontSize(20)
    .font('Helvetica-Bold')
    .fillColor('#2c5f8a')
    .text(`${typeLabel} CERTIFICATE`, { align: 'center' });

  doc.moveDown(1.5);

  // ── Body ─────────────────────────────────────────────────
  doc.fillColor('#000').fontSize(13).font('Helvetica');

  const field = (label, value) => {
    doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
    doc.font('Helvetica').text(value || 'N/A');
    doc.moveDown(0.4);
  };

  field('Certificate No.', `KBL-${String(cert.id).padStart(6, '0')}`);
  field('Resident Name',   cert.resident_name);
  field('Certificate Type', cert.certificate_type);
  field('Issue Date',      cert.issue_date ? new Date(cert.issue_date).toDateString() : new Date().toDateString());
  field('Status',          'ISSUED');

  doc.moveDown(2);

  // ── Footer ────────────────────────────────────────────────
  doc
    .moveTo(60, doc.y).lineTo(535, doc.y)
    .strokeColor('#aaa').lineWidth(1).stroke();
  doc.moveDown(0.5);
  doc
    .fontSize(10).fillColor('#555').font('Helvetica')
    .text('This certificate is officially issued by Heremata Mentina Kebele Administration.', { align: 'center' })
    .text('For verification, contact the kebele office.', { align: 'center' });

  doc.end();
};

module.exports = { generateCertificate };
