/**
 * Generate compliance report
 */

import { getAllPayments } from '../database.js';
import { getRates } from '../exchangeRates.js';
import { config } from '../config.js';

/**
 * Generate compliance report
 */
export async function handleGenerateReport() {
  try {
    console.log('Generating compliance report...\n');

    const payments = getAllPayments();

    if (payments.length === 0) {
      console.log('No payments found in database.');
      return;
    }

    // Fetch all exchange rates we need
    console.log('Fetching exchange rates...');
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

    console.log('✓ Exchange rates fetched\n');

    // Part 1: Calendar Year Income Check
    console.log('='.repeat(70));
    console.log('CALENDAR YEAR INCOME ANALYSIS');
    console.log('='.repeat(70));
    console.log(`Limit: ${config.limits.calendarYear.toLocaleString('en-US')} RSD per calendar year\n`);

    const yearlyIncome = {};
    
    for (const payment of paymentsWithRsd) {
      const year = payment.date.substring(0, 4);
      if (!yearlyIncome[year]) {
        yearlyIncome[year] = {
          totalRsd: 0,
          payments: []
        };
      }
      yearlyIncome[year].totalRsd += payment.amount_rsd;
      yearlyIncome[year].payments.push(payment);
    }

    for (const [year, data] of Object.entries(yearlyIncome).sort()) {
      const exceeds = data.totalRsd > config.limits.calendarYear;
      const status = exceeds ? '⚠️  EXCEEDS LIMIT' : '✓ Within limit';
      
      console.log(`Year ${year}:`);
      console.log(`  Total Income: ${data.totalRsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RSD`);
      console.log(`  Number of Payments: ${data.payments.length}`);
      console.log(`  Status: ${status}`);
      
      if (exceeds) {
        console.log(`  ⚠️  Exceeds by: ${(data.totalRsd - config.limits.calendarYear).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RSD`);
      }
      console.log();
    }

    // Part 2: Rolling 365-Day Check
    console.log('='.repeat(70));
    console.log('ROLLING 365-DAY INCOME ANALYSIS');
    console.log('='.repeat(70));
    console.log(`Limit: ${config.limits.rolling365Days.toLocaleString('en-US')} RSD per any 365-day period\n`);

    const violations = [];
    const sortedPayments = [...paymentsWithRsd].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Check every possible 365-day window
    for (let i = 0; i < sortedPayments.length; i++) {
      const startDate = new Date(sortedPayments[i].date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 365);

      let windowTotal = 0;
      const windowPayments = [];

      for (let j = i; j < sortedPayments.length; j++) {
        const paymentDate = new Date(sortedPayments[j].date);
        if (paymentDate < endDate) {
          windowTotal += sortedPayments[j].amount_rsd;
          windowPayments.push(sortedPayments[j]);
        } else {
          break;
        }
      }

      if (windowTotal > config.limits.rolling365Days) {
        violations.push({
          startDate: sortedPayments[i].date,
          endDate: formatDate(new Date(endDate.getTime() - 1)), // -1 day since it's exclusive
          total: windowTotal,
          excess: windowTotal - config.limits.rolling365Days,
          paymentCount: windowPayments.length
        });
      }
    }

    if (violations.length === 0) {
      console.log('✓ No violations found. All 365-day periods are within the limit.\n');
    } else {
      console.log(`⚠️  Found ${violations.length} period(s) that exceed the limit:\n`);
      
      violations.forEach((violation, index) => {
        console.log(`Violation ${index + 1}:`);
        console.log(`  Period: ${violation.startDate} to ${violation.endDate}`);
        console.log(`  Total Income: ${violation.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RSD`);
        console.log(`  Exceeds by: ${violation.excess.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RSD`);
        console.log(`  Number of Payments: ${violation.paymentCount}`);
        console.log();
      });
    }

    console.log('='.repeat(70));
    console.log('Report generation complete.');
    
  } catch (error) {
    console.error('Error generating report:', error.message);
    process.exit(1);
  }
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

