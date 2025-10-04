#!/usr/bin/env node
import { Command } from 'commander';
import { initDatabase, closeDatabase } from './database.js';
import { handleAddPayment, handleDeletePayment } from './commands/paymentCommands.js';
import { handleGenerateReport } from './commands/reportCommand.js';
import { handleGenerateInvoice, handleGenerateAllInvoices } from './commands/invoiceCommands.js';
import { handleGenerateKpo } from './commands/kpoCommand.js';
import { handleGenerateTable } from './commands/tableCommand.js';
import { handleExportPayments, handleImportPayments } from './commands/csvCommands.js';

const program = new Command();

// Initialize database
initDatabase();

program
  .name('srb-pausal-cli')
  .description('Invoice and KPO generator for Serbian contractor with EU company')
  .version('1.0.0');

// Command: add-payment
program
  .command('add-payment')
  .description('Add a new incoming payment record')
  .argument('<date>', 'Payment date in YYYY-MM-DD format (e.g., 2025-10-20)')
  .argument('<amount_eur>', 'Amount received in Euros (e.g., 4250.75)')
  .action((date, amountEur) => {
    handleAddPayment(date, amountEur);
    closeDatabase();
  });

// Command: delete-payment
program
  .command('delete-payment')
  .description('Delete a specific payment record')
  .argument('<payment_id>', 'The unique identifier of the payment to remove')
  .action((paymentId) => {
    handleDeletePayment(paymentId);
    closeDatabase();
  });

// Command: generate-report
program
  .command('generate-report')
  .description('Generate compliance report with income analysis')
  .action(async () => {
    await handleGenerateReport();
    closeDatabase();
  });

// Command: generate-invoice
program
  .command('generate-invoice')
  .description('Generate a PDF invoice for a specific payment')
  .argument('<payment_id>', 'The unique identifier of the payment')
  .action(async (paymentId) => {
    await handleGenerateInvoice(paymentId);
    closeDatabase();
  });

// Command: generate-all-invoices
program
  .command('generate-all-invoices')
  .description('Generate PDF invoices for all payments')
  .action(async () => {
    await handleGenerateAllInvoices();
    closeDatabase();
  });

// Command: generate-kpo
program
  .command('generate-kpo')
  .description('Generate KPO book (Knjiga o ostvarenom prometu) for a year')
  .argument('<year>', 'The calendar year (e.g., 2025)')
  .action(async (year) => {
    await handleGenerateKpo(year);
    closeDatabase();
  });

// Command: generate-table
program
  .command('generate-table')
  .description('Generate table with all payments in EUR, RSD, and USD')
  .option('--start <date>', 'Start date (YYYY-MM-DD)')
  .option('--end <date>', 'End date (YYYY-MM-DD)')
  .action(async (options) => {
    await handleGenerateTable(options.start, options.end);
    closeDatabase();
  });

// Command: export-payments
program
  .command('export-payments')
  .description('Export all payments to CSV file')
  .argument('[output]', 'Output CSV file path (default: payments_export_YYYY-MM-DD.csv)')
  .action(async (output) => {
    await handleExportPayments(output);
    closeDatabase();
  });

// Command: import-payments
program
  .command('import-payments')
  .description('Import payments from CSV file')
  .argument('<input>', 'Input CSV file path')
  .action(async (input) => {
    await handleImportPayments(input);
    closeDatabase();
  });

// Parse command line arguments
program.parse(process.argv);

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
  closeDatabase();
}

