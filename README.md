# SRB Factura CLI

A Node.js CLI application for Serbian contractors working with EU companies. This tool helps manage payments, generate invoices, create KPO (Knjiga o ostvarenom prometu) reports, and ensure tax compliance according to Serbian regulations.

## Features

- 📝 **Invoice Generation**: Create professional bilingual (English/Serbian) PDF invoices
- 📊 **KPO Book**: Generate the official KPO (Knjiga o ostvarenom prometu) book required by Serbian tax law
- 💰 **Payment Tracking**: Store and manage payment records in SQLite database
- 📈 **Compliance Reports**: Automatic monitoring of tax thresholds (6M RSD calendar year, 8M RSD rolling 365 days)
- 💱 **Exchange Rates**: Automatic fetching and caching of exchange rates from:
  - National Bank of Serbia (NBS) for EUR→RSD
  - European Central Bank (ECB) for EUR→USD
- 📋 **Payment Tables**: Generate formatted tables with payments in EUR, RSD, and USD
- 📤 **CSV Export/Import**: Export and import payment data for backup and migration

## Prerequisites

- **Node.js** 18 or higher
- **npm** (comes with Node.js)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd srb-factura-cli
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the application**
   ```bash
   cp src/config.example.js src/config.js
   ```
   
   Then edit `src/config.js` with your personal and business information:
   - Your contractor details (name, address, tax ID, bank account, etc.)
   - Your client's company details
   - Your hourly rate

4. **Add your company logo**
   
   Place your company logo (PNG format) at `src/assets/logo.png`

5. **Build the application**
   ```bash
   npm run build
   ```

## Configuration

The `src/config.js` file contains all the configuration for the application:

### Contractor Details
Your business information as registered in Serbia (name, address, tax ID, registration number, bank details, email, etc.)

### Company Details
Your client's company information (name, address, VAT number, registration number)

### Tax Limits
Serbian tax law thresholds for small business tax exemption:
- **Calendar Year Limit**: 6,000,000 RSD
- **Rolling 365 Days Limit**: 8,000,000 RSD

### Logo Path
Path to your company logo (relative to project root)

## Usage

After building, you can use the CLI:

```bash
npm start -- <command> [options]
```

Or if you want to use it globally, you can link it:
```bash
npm link
srb-factura-cli <command> [options]
```

### Available Commands

#### Add Payment
```bash
srb-factura-cli add-payment <date> <amount_eur>
```
Example:
```bash
srb-factura-cli add-payment 2025-01-15 5000.00
```

#### Delete Payment
```bash
srb-factura-cli delete-payment <payment_id>
```

#### Generate Invoice
```bash
srb-factura-cli generate-invoice <payment_id>
```
Generates a professional PDF invoice for a specific payment.

#### Generate All Invoices
```bash
srb-factura-cli generate-all-invoices
```
Generates invoices for all payments in the database.

#### Generate KPO Book
```bash
srb-factura-cli generate-kpo <year>
```
Example:
```bash
srb-factura-cli generate-kpo 2025
```
Generates the official KPO book (Knjiga o ostvarenom prometu) required by Serbian tax authorities.

#### Generate Payment Table
```bash
srb-factura-cli generate-table [--start YYYY-MM-DD] [--end YYYY-MM-DD]
```
Displays a formatted table with all payments showing amounts in EUR, RSD (from NBS), and USD (from ECB).

Examples:
```bash
# All payments
srb-factura-cli generate-table

# Payments in specific date range
srb-factura-cli generate-table --start 2025-01-01 --end 2025-12-31
```

#### Generate Compliance Report
```bash
srb-factura-cli generate-report
```
Generates a detailed report showing:
- Income analysis for current calendar year
- Income analysis for rolling 365 days
- Tax threshold compliance status
- Whether you need to register for VAT

#### Export Payments
```bash
srb-factura-cli export-payments [output.csv]
```
Exports all payments to a CSV file (defaults to `payments.csv`).

#### Import Payments
```bash
srb-factura-cli import-payments <input.csv>
```
Imports payments from a CSV file.

## Project Structure

```
srb-factura-cli/
├── src/
│   ├── assets/              # Logo and other assets
│   ├── commands/            # CLI command handlers
│   │   ├── csvCommands.js
│   │   ├── paymentCommands.js
│   │   ├── reportCommand.js
│   │   └── tableCommand.js
│   ├── pdf/                 # PDF generators
│   │   ├── invoiceGenerator.jsx
│   │   └── kpoGenerator.jsx
│   ├── rates-providers/     # Exchange rate providers
│   │   ├── europe.rates-provider.js
│   │   └── serbia.rates-provider.js
│   ├── config.example.js    # Example configuration
│   ├── config.js            # Your configuration (gitignored)
│   ├── database.js          # SQLite database operations
│   ├── exchangeRates.js     # Exchange rate fetching and caching
│   └── index.js             # CLI entry point
├── dist/                    # Built application
├── output/                  # Generated files
│   ├── invoices/
│   └── kpo/
├── data.db                  # SQLite database (gitignored)
└── package.json
```

## How It Works

### Payment Management
Payments are stored in a SQLite database with the following information:
- Payment date
- Amount in EUR
- Associated invoice number
- Exchange rate (EUR→RSD) from NBS for the payment date

### Invoice Generation
Invoices are generated as PDF files using React-PDF with:
- Bilingual format (English/Serbian)
- Your company logo
- Professional layout matching Serbian invoice standards
- Tax exemption notes according to Serbian VAT law
- Unique invoice numbering (format: XX/YYYY)

### KPO Book Generation
The KPO (Knjiga o ostvarenom prometu) is an official document required by Serbian tax authorities showing all business turnover. The generator:
- Fetches all payments for the specified year
- Converts EUR amounts to RSD using official NBS exchange rates
- Formats the data according to Serbian regulatory requirements
- Generates a professional PDF document

### Exchange Rates
The application automatically fetches exchange rates from:
- **NBS (National Bank of Serbia)**: For EUR→RSD conversions
- **ECB (European Central Bank)**: For EUR→USD conversions

Exchange rates are cached in the database to minimize API calls.

### Tax Compliance
The compliance report monitors two key thresholds:
1. **Calendar Year**: 6,000,000 RSD (January 1 - December 31)
2. **Rolling 365 Days**: 8,000,000 RSD (any consecutive 365-day period)

## Development

### Build
```bash
npm run build
```

### Clean Build
```bash
rm -rf dist/
npm run build
```

## Database Schema

### Payments Table
- `id`: INTEGER PRIMARY KEY
- `date`: TEXT (YYYY-MM-DD format)
- `amount_eur`: REAL
- `invoice_number`: TEXT
- `exchange_rate`: REAL

### Exchange Rates Table
- `id`: INTEGER PRIMARY KEY
- `date`: TEXT (YYYY-MM-DD format)
- `from_currency`: TEXT (e.g., 'EUR')
- `to_currency`: TEXT (e.g., 'RSD')
- `rate`: REAL

## Legal Disclaimer

This tool is provided as-is to help with invoice and KPO generation. It is your responsibility to ensure that all generated documents comply with current Serbian tax laws and regulations. Always consult with a qualified accountant or tax advisor for compliance matters.

## License

MIT