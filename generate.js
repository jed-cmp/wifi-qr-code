'use strict';

require('dotenv').config();
const QRCode = require('qrcode');
const puppeteer = require('puppeteer');
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

// ── Escape text for safe HTML embedding ───────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Generate QR code as data URL, then build PDF via Puppeteer ────────────────
async function generate() {
  const qrDataUrl = await QRCode.toDataURL(wifiString, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 600,
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Helvetica, Arial, sans-serif;
      background: #ffffff;
      color: #000000;
    }

    .page {
      padding: 52px 64px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      border-bottom: 2px solid #000000;
      padding-bottom: 14px;
      margin-bottom: 40px;
    }
    .header h1 {
      font-size: 26px;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .header p {
      font-size: 10px;
      color: #666666;
      letter-spacing: 0.5px;
      text-align: right;
      line-height: 1.5;
      max-width: 220px;
    }

    /* ── QR section ── */
    .qr-section {
      display: flex;
      justify-content: center;
      margin-bottom: 40px;
    }
    .qr-card {
      border: 1px solid #000000;
      padding: 14px;
      display: inline-block;
    }
    .qr-card img {
      display: block;
      width: 200px;
      height: 200px;
    }

    /* ── Info section ── */
    .info-section {
      width: 100%;
    }
    .info-row {
      display: flex;
      align-items: baseline;
      padding: 12px 0;
      border-top: 1px solid #cccccc;
    }
    .info-row:last-child {
      border-bottom: 1px solid #cccccc;
    }
    .info-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #666666;
      width: 96px;
      flex-shrink: 0;
    }
    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: #000000;
      word-break: break-all;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 48px;
      font-size: 8px;
      letter-spacing: 0.5px;
      color: #aaaaaa;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="page">

    <div class="header">
      <h1>Wi&#8209;Fi&nbsp;Access</h1>
      <p>Scan the QR code with your phone&rsquo;s camera to connect instantly.</p>
    </div>

    <div class="qr-section">
      <div class="qr-card">
        <img src="${qrDataUrl}" alt="Wi-Fi QR Code">
      </div>
    </div>

    <div class="info-section">
      <div class="info-row">
        <span class="info-label">Network</span>
        <span class="info-value">${escapeHtml(SSID)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Password</span>
        <span class="info-value">${escapeHtml(PASSWORD)}</span>
      </div>
    </div>

    <p class="footer">Wi-Fi credentials &mdash; keep this page secure</p>

  </div>
</body>
</html>`;

  const outputPath = path.resolve(OUTPUT);

  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
    });
  } finally {
    await browser.close();
  }

  console.log(`✓ PDF generated: ${outputPath}`);
}

generate().catch((err) => {
  console.error('Failed to generate PDF:', err.message);
  process.exit(1);
});
