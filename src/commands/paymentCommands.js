/**
 * Payment management commands
 */

import { addPayment, deletePayment, getPayment } from '../database.js';

/**
 * Add a new payment
 */
export function handleAddPayment(date, amountEur) {
  try {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      console.error('Error: Date must be in YYYY-MM-DD format (e.g., 2025-10-20)');
      process.exit(1);
    }

    // Validate amount
    const amount = parseFloat(amountEur);
    if (isNaN(amount) || amount <= 0) {
      console.error('Error: Amount must be a positive number');
      process.exit(1);
    }

    const paymentId = addPayment(date, amount);
    console.log(`✓ Payment added successfully!`);
    console.log(`  Payment ID: ${paymentId}`);
    console.log(`  Date: ${date}`);
    console.log(`  Amount: €${amount.toFixed(2)}`);
  } catch (error) {
    console.error('Error adding payment:', error.message);
    process.exit(1);
  }
}

/**
 * Delete a payment
 */
export function handleDeletePayment(paymentId) {
  try {
    const id = parseInt(paymentId);
    if (isNaN(id)) {
      console.error('Error: Payment ID must be a number');
      process.exit(1);
    }

    // Check if payment exists
    const payment = getPayment(id);
    if (!payment) {
      console.error(`Error: Payment with ID ${id} not found`);
      process.exit(1);
    }

    const deleted = deletePayment(id);
    if (deleted) {
      console.log(`✓ Payment deleted successfully!`);
      console.log(`  Payment ID: ${id}`);
      console.log(`  Date: ${payment.date}`);
      console.log(`  Amount: €${payment.amount_eur.toFixed(2)}`);
    } else {
      console.error(`Error: Failed to delete payment ${id}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error deleting payment:', error.message);
    process.exit(1);
  }
}

