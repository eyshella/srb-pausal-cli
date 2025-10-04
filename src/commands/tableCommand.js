/**
 * Generate markdown table with all payments
 */

import { getAllPayments } from '../database.js';
import { getRates, getRate } from '../exchangeRates.js';

/**
 * Generate markdown table with payments in EUR, RSD, and USD
 * @param {string} startDate - Optional start date (YYYY-MM-DD)
 * @param {string} endDate - Optional end date (YYYY-MM-DD)
 */
export async function handleGenerateTable(startDate = null, endDate = null) {
  try {
    console.log('Generating payment table...\n');

    let payments = getAllPayments();

    if (payments.length === 0) {
      console.log('No payments found in database.');
      return;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      payments = payments.filter(payment => {
        const paymentDate = new Date(payment.date);
        if (startDate && new Date(startDate) > paymentDate) return false;
        if (endDate && new Date(endDate) < paymentDate) return false;
        return true;
      });

      if (payments.length === 0) {
        console.log(`No payments found in the specified date range (${startDate || 'beginning'} to ${endDate || 'now'}).`);
        return;
      }

      console.log(`Date range: ${startDate || 'beginning'} to ${endDate || 'now'}`);
      console.log(`Found ${payments.length} payment(s) in range\n`);
    }

    // Sort by date
    const sortedPayments = payments.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    console.log('Fetching exchange rates...');
    
    // Fetch all required rates
    const paymentsWithRates = [];
    for (const payment of sortedPayments) {
      try {
        // EUR to RSD (ensure cached via bulk API)
        const map = await getRates(payment.date, payment.date, 'EUR', 'RSD');
        const eurToRsd = map[payment.date];
        
        // EUR to USD (from ECB - we need to get USD rate)
        // ECB provides rates FROM EUR, so 1 EUR = X USD
        let eurToUsd;
        try {
          eurToUsd = await getRate(payment.date, 'EUR', 'USD');
        } catch (error) {
          console.log(`Using fallback USD rate for ${payment.date}`);
          eurToUsd = 1.10; // Fallback approximate rate
        }
        
        const amountRsd = payment.amount_eur * eurToRsd;
        const amountUsd = payment.amount_eur * eurToUsd;
        
        paymentsWithRates.push({
          ...payment,
          eur_to_rsd: eurToRsd,
          eur_to_usd: eurToUsd,
          amount_rsd: amountRsd,
          amount_usd: amountUsd
        });
      } catch (error) {
        console.error(`Failed to fetch rates for ${payment.date}:`, error.message);
        paymentsWithRates.push({
          ...payment,
          eur_to_rsd: null,
          eur_to_usd: null,
          amount_rsd: null,
          amount_usd: null
        });
      }
    }

    console.log('✓ Exchange rates fetched\n');

    // Display console table for better terminal viewing
    console.log('='.repeat(120));
    console.log('PAYMENT SUMMARY');
    console.log('='.repeat(120));
    
    // Create formatted array for console.table
    const tableData = paymentsWithRates.map(p => ({
      'ID': p.id,
      'Date': p.date,
      'EUR': p.amount_eur.toFixed(2),
      'EUR→RSD': p.eur_to_rsd ? p.eur_to_rsd.toFixed(4) : 'N/A',
      'RSD': p.amount_rsd ? p.amount_rsd.toFixed(2) : 'N/A',
      'EUR→USD': p.eur_to_usd ? p.eur_to_usd.toFixed(4) : 'N/A',
      'USD': p.amount_usd ? p.amount_usd.toFixed(2) : 'N/A'
    }));
    
    // Display table with specified columns only (removes index)
    console.table(tableData, ['ID', 'Date', 'EUR', 'EUR→RSD', 'RSD', 'EUR→USD', 'USD']);
    console.log('='.repeat(120));
    
    // Calculate totals
    const totalEur = paymentsWithRates.reduce((sum, p) => sum + p.amount_eur, 0);
    const totalRsd = paymentsWithRates.reduce((sum, p) => sum + (p.amount_rsd || 0), 0);
    const totalUsd = paymentsWithRates.reduce((sum, p) => sum + (p.amount_usd || 0), 0);
    
    console.log(`TOTALS: EUR: ${totalEur.toFixed(2)} | RSD: ${totalRsd.toFixed(2)} | USD: ${totalUsd.toFixed(2)}`);
    console.log('='.repeat(120));
    console.log();
  } catch (error) {
    console.error('Error generating table:', error.message);
    process.exit(1);
  }
}

/**
 * Format amount with thousand separators and 2 decimals
 */
function formatAmount(amount) {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

