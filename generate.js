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
      color: #1a1a2e;
    }

    /* ── Header banner ── */
    .header {
      background: #1a1a2e;
      padding: 28px 0;
      text-align: center;
    }
    .header h1 {
      font-size: 30px;
      font-weight: bold;
      color: #ffffff;
      letter-spacing: 1px;
    }

    /* ── Red accent stripe ── */
    .accent-top {
      height: 4px;
      background: #e94560;
    }

    /* ── Page body ── */
    .body {
      padding: 30px 60px;
    }

    /* ── Subtitle ── */
    .subtitle {
      font-size: 12px;
      color: #444444;
      text-align: center;
      margin-bottom: 28px;
    }

    /* ── QR card ── */
    .qr-wrapper {
      display: flex;
      justify-content: center;
      margin-bottom: 28px;
    }
    .qr-card {
      background: #ffffff;
      border: 1px solid #dddddd;
      padding: 14px;
      box-shadow: 3px 3px 0 #cccccc;
      display: inline-block;
    }
    .qr-card img {
      display: block;
      width: 210px;
      height: 210px;
    }

    /* ── Divider ── */
    .divider {
      border: none;
      border-top: 0.5px solid #cccccc;
      margin-bottom: 24px;
    }

    /* ── Info card ── */
    .info-card {
      background: #f7f7f9;
      border: 1px solid #e0e0e8;
      border-radius: 2px;
      width: 80%;
      margin: 0 auto;
      padding: 16px 20px;
    }
    .info-row {
      display: flex;
      align-items: baseline;
      min-height: 36px;
    }
    .info-label {
      font-size: 11px;
      font-weight: bold;
      color: #888888;
      text-transform: uppercase;
      width: 100px;
      flex-shrink: 0;
    }
    .info-value {
      font-size: 13px;
      font-weight: bold;
      color: #1a1a2e;
      word-break: break-all;
    }

    /* ── Bottom accent stripe ── */
    .accent-bottom {
      height: 2px;
      background: #e94560;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Wi-Fi Access</h1>
  </div>
  <div class="accent-top"></div>

  <div class="body">
    <p class="subtitle">Scan the QR code below with your phone&rsquo;s camera to connect instantly.</p>

    <div class="qr-wrapper">
      <div class="qr-card">
        <img src="${qrDataUrl}" alt="Wi-Fi QR Code">
      </div>
    </div>

    <hr class="divider">

    <div class="info-card">
      <div class="info-row">
        <span class="info-label">Network</span>
        <span class="info-value">${escapeHtml(SSID)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Password</span>
        <span class="info-value">${escapeHtml(PASSWORD)}</span>
      </div>
    </div>

    <div class="accent-bottom"></div>
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
