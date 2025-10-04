/**
 * KPO (Knjiga o ostvarenom prometu) book generation command
 */

import { getPaymentsByYear } from '../database.js';
import { getRates } from '../exchangeRates.js';
import { generateKpoPDF } from '../pdf/kpoGenerator.jsx';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

/**
 * Generate KPO book for a specific year
 */
export async function handleGenerateKpo(year) {
  try {
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      console.error('Error: Year must be a valid 4-digit year (e.g., 2025)');
      process.exit(1);
    }

    console.log(`Generating KPO book for year ${year}...`);

    const payments = getPaymentsByYear(year);

    if (payments.length === 0) {
      console.log(`No payments found for year ${year}.`);
      return;
    }

    console.log(`Found ${payments.length} payment(s) for ${year}`);
    console.log('Fetching exchange rates...');

    // Fetch exchange rates for all payments
    const paymentsWithRsd = [];
    for (const payment of payments) {
      const map = await getRates(payment.date, payment.date, 'EUR', 'RSD');
      const rate = map[payment.date];
      const amountRsd = payment.amount_eur * rate;
      paymentsWithRsd.push({
        ...payment,
        eur_to_rsd_rate: rate,
        amount_rsd: amountRsd
      });
    }

    console.log('✓ Exchange rates fetched');

    // Ensure output directory exists
    const outputDir = config.output.kpo;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `KPO_${year}.pdf`);

    await generateKpoPDF(paymentsWithRsd, year, outputPath);

    const totalRsd = paymentsWithRsd.reduce((sum, p) => sum + p.amount_rsd, 0);

    console.log(`✓ KPO book generated successfully!`);
    console.log(`  Year: ${year}`);
    console.log(`  Number of Entries: ${payments.length}`);
    console.log(`  Total Turnover: ${totalRsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RSD`);
    console.log(`  Output: ${outputPath}`);
  } catch (error) {
    console.error('Error generating KPO book:', error.message);
    process.exit(1);
  }
}

