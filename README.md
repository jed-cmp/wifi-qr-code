# Wi-Fi QR Code PDF Generator

Generates a printable PDF containing a Wi-Fi QR code that phone cameras can scan to connect instantly — no typing required.

Two output modes are supported:

- **Standard** — a single, full-page A4 card with the QR code and credentials
- **Compact** — a 2×5 grid of 10 small cards on one A4 sheet, ready to cut out

## Requirements

- [Node.js](https://nodejs.org/) 18+
- npm

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file and fill in your Wi-Fi credentials:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   WIFI_SSID=YourNetworkName
   WIFI_PASSWORD=YourPassword
   ```

## Usage

**Standard PDF** (one full-page card):

```bash
npm run generate
# Output: wifi-qr.pdf
```

**Compact PDF** (10 cut-out cards per page):

```bash
COMPACT=true npm run generate
# Output: wifi-qr-compact.pdf
```

**Custom output filename:**

```bash
OUTPUT=my-wifi.pdf npm run generate
```

On Windows (PowerShell), set env vars inline:

```powershell
$env:WIFI_SSID='MyNetwork'; $env:WIFI_PASSWORD='MyPassword'; npm run generate
$env:COMPACT='true'; npm run generate
```

## Environment Variables

| Variable        | Required | Default                                          | Description                              |
|-----------------|----------|--------------------------------------------------|------------------------------------------|
| `WIFI_SSID`     | Yes      | —                                                | Wi-Fi network name (SSID)                |
| `WIFI_PASSWORD` | Yes      | —                                                | Wi-Fi password                           |
| `COMPACT`       | No       | `false`                                          | Set to `true` for the 10-card layout     |
| `OUTPUT`        | No       | `wifi-qr.pdf` / `wifi-qr-compact.pdf`            | Output PDF filename or path              |

## Security Note

The generated PDF contains your Wi-Fi password in plain text. Treat it like any sensitive document — don't share it publicly or leave it in shared folders.
