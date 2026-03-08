'use strict';

require('dotenv').config();
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ── Validate environment variables ────────────────────────────────────────────
const SSID = process.env.WIFI_SSID;
const PASSWORD = process.env.WIFI_PASSWORD;
const OUTPUT = process.env.OUTPUT || 'wifi-qr.pdf';

const missing = [];
if (!SSID) missing.push('WIFI_SSID');
if (!PASSWORD) missing.push('WIFI_PASSWORD');
if (missing.length > 0) {
  console.error(`Error: Missing required environment variable(s): ${missing.join(', ')}`);
  console.error('Copy .env.example to .env and fill in your Wi-Fi credentials.');
  process.exit(1);
}

// ── Build WiFi QR string (standard WPA2 format) ───────────────────────────────
// Escape special chars: ; \ , " in SSID/password per the spec
function escapeWifi(str) {
  return str.replace(/([\\;,"])/g, '\\$1');
}
const wifiString = `WIFI:T:WPA;S:${escapeWifi(SSID)};P:${escapeWifi(PASSWORD)};;`;

// ── Generate QR code as PNG buffer, then build PDF ────────────────────────────
async function generate() {
  const qrBuffer = await QRCode.toBuffer(wifiString, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 600,
  });

  const outputPath = path.resolve(OUTPUT);
  const doc = new PDFDocument({ size: 'A4', margin: 60 });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // ── Heading ────────────────────────────────────────────────────────────────
  doc
    .font('Helvetica-Bold')
    .fontSize(28)
    .text('Wi-Fi Access', { align: 'center' });

  doc.moveDown(0.5);

  // ── Subtitle ───────────────────────────────────────────────────────────────
  doc
    .font('Helvetica')
    .fontSize(13)
    .fillColor('#555555')
    .text('Scan the QR code with your phone to connect instantly.', { align: 'center' });

  doc.moveDown(1.5);

  // ── QR code image (centered) ───────────────────────────────────────────────
  const qrSize = 220;
  const qrX = doc.page.margins.left + (pageWidth - qrSize) / 2;
  doc.image(qrBuffer, qrX, doc.y, { width: qrSize, height: qrSize });
  doc.y += qrSize + 30;

  // ── Network info ───────────────────────────────────────────────────────────
  const labelWidth = 90;
  const valueX = doc.page.margins.left + labelWidth;

  function infoRow(label, value) {
    const rowY = doc.y;
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#000000')
      .text(label, doc.page.margins.left, rowY, { width: labelWidth, continued: false });

    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor('#222222')
      .text(value, valueX, rowY, { width: pageWidth - labelWidth });

    doc.moveDown(0.6);
  }

  infoRow('Network:', SSID);
  infoRow('Password:', PASSWORD);

  // ── Footer ─────────────────────────────────────────────────────────────────
  doc.moveDown(2);
  doc
    .font('Helvetica')
    .fontSize(10)
    .fillColor('#aaaaaa')
    .text('Keep this document in a safe place.', { align: 'center' });

  doc.end();

  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  console.log(`✓ PDF generated: ${outputPath}`);
}

generate().catch((err) => {
  console.error('Failed to generate PDF:', err.message);
  process.exit(1);
});
