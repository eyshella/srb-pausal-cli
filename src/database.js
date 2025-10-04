/**
 * Database module for managing SQLite database
 */

import Database from 'better-sqlite3';
import { config } from './config.js';
import fs from 'fs';
import path from 'path';

let db = null;

/**
 * Initialize database connection and create tables if needed
 */
export function initDatabase() {
  // Ensure directory exists
  const dbDir = path.dirname(config.database.path);
  if (!fs.existsSync(dbDir) && dbDir !== '.') {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(config.database.path);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  createTables();
  
  return db;
}

/**
 * Create database tables
 */
function createTables() {
  // Payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      amount_eur REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Exchange rates cache table - stores all currency rates
  db.exec(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      from_currency TEXT NOT NULL,
      to_currency TEXT NOT NULL,
      rate REAL NOT NULL,
      fetched_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, from_currency, to_currency)
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
    CREATE INDEX IF NOT EXISTS idx_exchange_rates_date ON exchange_rates(date);
  `);
}

/**
 * Get database instance
 */
export function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Add a new payment
 */
export function addPayment(date, amountEur) {
  const db = getDatabase();
  const stmt = db.prepare('INSERT INTO payments (date, amount_eur) VALUES (?, ?)');
  const result = stmt.run(date, amountEur);
  return result.lastInsertRowid;
}

/**
 * Delete a payment
 */
export function deletePayment(paymentId) {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM payments WHERE id = ?');
  const result = stmt.run(paymentId);
  return result.changes > 0;
}

/**
 * Get payment by ID
 */
export function getPayment(paymentId) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM payments WHERE id = ?');
  return stmt.get(paymentId);
}

/**
 * Get all payments
 */
export function getAllPayments() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM payments ORDER BY date ASC');
  return stmt.all();
}

/**
 * Get payments by year
 */
export function getPaymentsByYear(year) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM payments 
    WHERE date LIKE ? 
    ORDER BY date ASC
  `);
  return stmt.all(`${year}-%`);
}

/**
 * Save exchange rate
 */
export function saveExchangeRate(date, fromCurrency, toCurrency, rate) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO exchange_rates (date, from_currency, to_currency, rate) 
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(date, fromCurrency, toCurrency, rate);
}

/**
 * Get exchange rate for a specific date and currency pair
 */
export function getExchangeRate(date, fromCurrency, toCurrency) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT rate FROM exchange_rates 
    WHERE date = ? AND from_currency = ? AND to_currency = ?
  `);
  const result = stmt.get(date, fromCurrency, toCurrency);
  return result ? result.rate : null;
}

/**
 * Get all exchange rates
 */
export function getAllExchangeRates() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM exchange_rates ORDER BY date ASC');
  return stmt.all();
}

/**
 * Get all rates for a specific date
 */
export function getRatesForDate(date) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT from_currency, to_currency, rate 
    FROM exchange_rates 
    WHERE date = ?
  `);
  return stmt.all(date);
}

