/**
 * Invoice generation commands
 */

import { getPayment, getAllPayments } from '../database.js';
import { generateInvoicePDF } from '../pdf/invoiceGenerator.jsx';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

/**
 * Generate invoice for a specific payment
 */
export async function handleGenerateInvoice(paymentId) {
  try {
    const id = parseInt(paymentId);
    if (isNaN(id)) {
      console.error('Error: Payment ID must be a number');
      process.exit(1);
    }

    const payment = getPayment(id);
    if (!payment) {
      console.error(`Error: Payment with ID ${id} not found`);
      process.exit(1);
    }

    console.log(`Generating invoice for payment ${id}...`);
    
    // Ensure output directory exists
    const outputDir = config.output.invoices;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate invoice number (MM/YYYY format)
    const invoiceNumber = getInvoiceNumber(payment.date);
    const outputPath = path.join(outputDir, `invoice_${invoiceNumber.replace('/', '-')}.pdf`);

    await generateInvoicePDF(payment, invoiceNumber, outputPath);

    console.log(`✓ Invoice generated successfully!`);
    console.log(`  Invoice Number: ${invoiceNumber}`);
    console.log(`  Payment Date: ${payment.date}`);
    console.log(`  Amount: €${payment.amount_eur.toFixed(2)}`);
    console.log(`  Output: ${outputPath}`);
  } catch (error) {
    console.error('Error generating invoice:', error.message);
    process.exit(1);
  }
}

/**
 * Generate invoices for all payments
 */
export async function handleGenerateAllInvoices() {
  try {
    const payments = getAllPayments();

    if (payments.length === 0) {
      console.log('No payments found in database.');
      return;
    }

    console.log(`Generating ${payments.length} invoice(s)...\n`);

    // Ensure output directory exists
    const outputDir = config.output.invoices;
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    let successCount = 0;
    let failCount = 0;

    for (const payment of payments) {
      try {
        const invoiceNumber = getInvoiceNumber(payment.date);
        const outputPath = path.join(outputDir, `invoice_${invoiceNumber.replace('/', '-')}.pdf`);

        await generateInvoicePDF(payment, invoiceNumber, outputPath);
        
        console.log(`✓ Generated invoice ${invoiceNumber} for payment ID ${payment.id}`);
        successCount++;
      } catch (error) {
        console.error(`✗ Failed to generate invoice for payment ID ${payment.id}: ${error.message}`);
        failCount++;
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`Invoice generation complete!`);
    console.log(`  Success: ${successCount}`);
    if (failCount > 0) {
      console.log(`  Failed: ${failCount}`);
    }
    console.log(`  Output directory: ${outputDir}`);
  } catch (error) {
    console.error('Error generating invoices:', error.message);
    process.exit(1);
  }
}

/**
 * Get invoice number in MM/YYYY format
 */
function getInvoiceNumber(date) {
  const [year, month] = date.split('-');
  return `${month}/${year}`;
}

