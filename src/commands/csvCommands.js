/**
 * CSV export/import commands for payments
 */

import { getAllPayments, addPayment } from '../database.js';
import fs from 'fs';
import path from 'path';

/**
 * Export payments to CSV file
 */
export async function handleExportPayments(outputPath = null) {
  try {
    const payments = getAllPayments();

    if (payments.length === 0) {
      console.log('No payments found in database.');
      return;
    }

    // Default output path
    if (!outputPath) {
      outputPath = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
    }

    // Create CSV content
    const csvLines = [];
    
    // Header
    csvLines.push('id,date,amount_eur,created_at');
    
    // Data rows
    payments.forEach(payment => {
      csvLines.push(`${payment.id},${payment.date},${payment.amount_eur},${payment.created_at || ''}`);
    });

    const csvContent = csvLines.join('\n');

    // Write to file
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`✓ Successfully exported ${payments.length} payment(s) to ${outputPath}`);
    console.log();
    console.log('CSV format:');
    console.log('  id,date,amount_eur,created_at');
    console.log();
    console.log('You can edit this file and re-import it later.');

  } catch (error) {
    console.error('Error exporting payments:', error.message);
    process.exit(1);
  }
}

/**
 * Import payments from CSV file
 */
export async function handleImportPayments(inputPath, options = {}) {
  try {
    if (!inputPath) {
      console.error('Error: Please provide a CSV file path');
      console.log('Usage: npm start import-payments <file.csv>');
      process.exit(1);
    }

    // Check if file exists
    if (!fs.existsSync(inputPath)) {
      console.error(`Error: File not found: ${inputPath}`);
      process.exit(1);
    }

    // Read CSV file
    const csvContent = fs.readFileSync(inputPath, 'utf8');
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
      console.error('Error: CSV file is empty or has no data rows');
      process.exit(1);
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim());
    
    // Validate header
    const requiredColumns = ['date', 'amount_eur'];
    const missingColumns = requiredColumns.filter(col => !header.includes(col));
    
    if (missingColumns.length > 0) {
      console.error(`Error: CSV missing required columns: ${missingColumns.join(', ')}`);
      console.log('Required columns: date, amount_eur');
      console.log(`Found columns: ${header.join(', ')}`);
      process.exit(1);
    }

    // Get column indices
    const dateIndex = header.indexOf('date');
    const amountIndex = header.indexOf('amount_eur');

    console.log(`Reading ${lines.length - 1} row(s) from ${inputPath}...\n`);

    // Parse and validate data
    const paymentsToImport = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = line.split(',').map(v => v.trim());
      
      const date = values[dateIndex];
      const amountStr = values[amountIndex];

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.push(`Row ${i + 1}: Invalid date format "${date}" (expected YYYY-MM-DD)`);
        continue;
      }

      // Validate amount
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount <= 0) {
        errors.push(`Row ${i + 1}: Invalid amount "${amountStr}" (must be a positive number)`);
        continue;
      }

      paymentsToImport.push({ date, amount });
    }

    // Show errors if any
    if (errors.length > 0) {
      console.log('⚠️  Validation errors found:\n');
      errors.forEach(error => console.log(`  ${error}`));
      console.log();
    }

    if (paymentsToImport.length === 0) {
      console.error('Error: No valid payments to import');
      process.exit(1);
    }

    // Show summary and ask for confirmation (unless --yes flag)
    console.log(`Found ${paymentsToImport.length} valid payment(s) to import:`);
    console.log();
    
    // Show preview of first few
    const previewCount = Math.min(5, paymentsToImport.length);
    paymentsToImport.slice(0, previewCount).forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.date} - €${p.amount.toFixed(2)}`);
    });
    
    if (paymentsToImport.length > previewCount) {
      console.log(`  ... and ${paymentsToImport.length - previewCount} more`);
    }
    console.log();

    // Import payments
    let successCount = 0;
    let failCount = 0;

    console.log('Importing payments...\n');

    for (const payment of paymentsToImport) {
      try {
        const paymentId = addPayment(payment.date, payment.amount);
        console.log(`✓ Added payment: ${payment.date} - €${payment.amount.toFixed(2)} (ID: ${paymentId})`);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed to add payment ${payment.date}: ${error.message}`);
        failCount++;
      }
    }

    console.log();
    console.log('='.repeat(60));
    console.log('Import Summary:');
    console.log(`  Success: ${successCount}`);
    if (failCount > 0) {
      console.log(`  Failed: ${failCount}`);
    }
    if (errors.length > 0) {
      console.log(`  Skipped (validation errors): ${errors.length}`);
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('Error importing payments:', error.message);
    process.exit(1);
  }
}

