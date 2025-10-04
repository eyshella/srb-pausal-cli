/**
 * PDF invoice generator using React-PDF
 */

import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { config } from '../config.js';

// Use logo path from config
const logoPath = path.resolve(process.cwd(), config.logoPath);

// Register font that supports Serbian diacritics if provided
if (config.fontPath) {
  try {
    const fontAbs = path.resolve(process.cwd(), config.fontPath);
    Font.register({
      family: 'AppFont',
      fonts: [
        { src: fontAbs, fontWeight: 'normal' },
        { src: fontAbs, fontWeight: 'bold' },
      ],
    });
  } catch (e) {
    // Fallback silently to default Helvetica
  }
}

const baseFontFamily = config.fontPath ? 'AppFont' : 'Helvetica';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: baseFontFamily,
  },
  topSection: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  invoiceTitle: {
    fontSize: 18,
    fontFamily: baseFontFamily,
    fontWeight: 'bold',
  },
  invoiceNumber: {
    fontSize: 18,
    marginTop: 5,
  },
  rightInfo: {
    fontSize: 9,
    textAlign: 'left',
  },
  rightInfoText: {
    marginBottom: 2,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginVertical: 15,
  },
  fromToSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  column: {
    width: '45%',
  },
  sectionTitle: {
    fontSize: 9,
    marginBottom: 5,
  },
  companyName: {
    fontSize: 10,
    fontFamily: baseFontFamily,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  detailText: {
    fontSize: 9,
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    paddingVertical: 5,
    fontSize: 8,
    fontFamily: baseFontFamily,
    fontWeight: 'bold',
    marginTop: 20,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#000',
    fontSize: 9,
  },
  col1: { width: '28%', paddingLeft: 5 },
  col2: { width: '12%', textAlign: 'center' },
  col3: { width: '12%', textAlign: 'center' },
  col4: { width: '12%', textAlign: 'right' },
  col5: { width: '12%', textAlign: 'right' },
  col6: { width: '12%', textAlign: 'right', paddingRight: 5 },
  totalsSection: {
    marginTop: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  totalMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 5,
    fontFamily: baseFontFamily,
    fontWeight: 'bold',
    fontSize: 10,
  },
  totalPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 5,
    fontFamily: baseFontFamily,
    fontWeight: 'bold',
    fontSize: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    marginTop: 5,
  },
  commentSection: {
    marginTop: 20,
    fontSize: 8,
  },
  commentTitle: {
    fontSize: 9,
    fontFamily: baseFontFamily,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  commentText: {
    marginBottom: 3,
    lineHeight: 1.4,
  },
  taxNote: {
    marginTop: 15,
    fontSize: 8,
  },
  taxNoteTitle: {
    fontSize: 8,
    fontFamily: baseFontFamily,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  taxNoteText: {
    fontSize: 7,
    lineHeight: 1.4,
    marginBottom: 2,
  },
});

// Invoice Document Component
const InvoiceDocument = ({ payment, invoiceNumber }) => {
  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top Section with Logo and Header */}
        <View style={styles.topSection}>
          {/* Logo */}
          <Image src={logoPath} style={styles.logo} />
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.invoiceTitle}>Invoice / Faktura:</Text>
              <Text style={styles.invoiceNumber}>{invoiceNumber}</Text>
            </View>
            <View style={styles.rightInfo}>
              <Text style={styles.rightInfoText}>Invoice date / Datum fakture</Text>
              <Text style={styles.rightInfoText}>{formatDate(payment.date)}</Text>
              <Text style={[styles.rightInfoText, { marginTop: 8 }]}>Trading date / Datum prometa</Text>
              <Text style={styles.rightInfoText}>{formatDate(payment.date)}</Text>
              <Text style={[styles.rightInfoText, { marginTop: 8 }]}>Trading place / Mesto prometa</Text>
              <Text style={styles.rightInfoText}>{config.company.city}, {config.company.country}</Text>
            </View>
          </View>
        </View>

        <View style={styles.separator} />

        {/* From / To Section */}
        <View style={styles.fromToSection}>
          {/* From / Od */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>From / Od:</Text>
            <Text style={styles.companyName}>{(config.contractor.shortName || '').toUpperCase()}</Text>
            <Text style={styles.detailText}>{config.contractor.longName || (config.contractor.shortName || '').toUpperCase()}</Text>
            <Text style={styles.detailText}>{config.contractor.address}</Text>
            <Text style={styles.detailText}>{config.contractor.city} {config.contractor.postalCode}</Text>
            <Text style={styles.detailText}>VAT / EIB / PIB: {config.contractor.taxId}</Text>
            <Text style={styles.detailText}>ID no / MB / Matični broj: {config.contractor.registrationNumber || ''}</Text>
            <Text style={styles.detailText}>IBAN: {config.contractor.iban || config.contractor.accountNumber}</Text>
            <Text style={styles.detailText}>SWIFT: {config.contractor.swift || ''}</Text>
            <Text style={styles.detailText}>E-mail: {config.contractor.email || ''}</Text>
          </View>

          {/* Bill to / Komitent */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>Bill to / Komitent:</Text>
            <Text style={styles.companyName}>{config.company.name}</Text>
            <Text style={styles.detailText}>Address / Adresa: {config.company.address}</Text>
            <Text style={styles.detailText}>City / Grad: {config.company.city}</Text>
            <Text style={styles.detailText}>Country / Država: {config.company.country}</Text>
            <Text style={styles.detailText}>VAT / EIB / PIB: {config.company.vatNumber || ''}</Text>
            <Text style={styles.detailText}>ID no / MB / Matični broj: {config.company.registrationNumber || ''}</Text>
          </View>
        </View>

        {/* Services Table */}
        <View style={styles.tableHeader}>
          <View style={styles.col1}>
            <Text>TYPE OF SERVICE</Text>
            <Text>(VRSTA USLUGE)</Text>
          </View>
          <View style={styles.col2}>
            <Text>UNIT</Text>
            <Text>(JEDINICA)</Text>
          </View>
          <View style={styles.col3}>
            <Text>QUANTITY</Text>
            <Text>(KOLIČINA)</Text>
          </View>
          <View style={styles.col4}>
            <Text>PRICE</Text>
            <Text>(CENA)</Text>
          </View>
          <View style={styles.col5}>
            <Text>DISCOUNT</Text>
            <Text>(RABAT)</Text>
          </View>
          <View style={styles.col6}>
            <Text>TOTAL</Text>
            <Text>(UKUPNO)</Text>
          </View>
        </View>

        {/* Service Row */}
        <View style={styles.tableRow}>
          <View style={styles.col1}>
            <Text>Technical system support</Text>
            <Text>provision</Text>
          </View>
          <View style={styles.col2}>
            <Text>Piece /</Text>
            <Text>Komad</Text>
          </View>
          <View style={styles.col3}>
            <Text>1,00</Text>
          </View>
          <View style={styles.col4}>
            <Text>{payment.amount_eur.toFixed(2)}</Text>
          </View>
          <View style={styles.col5}>
            <Text>0.00</Text>
          </View>
          <View style={styles.col6}>
            <Text>{payment.amount_eur.toFixed(2)}</Text>
          </View>
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalMainRow}>
            <Text>TOTAL / UKUPNO (EUR)</Text>
            <Text>{payment.amount_eur.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>DISCOUNT / RABAT (EUR)</Text>
            <Text>0.00</Text>
          </View>
          <View style={styles.totalPaymentRow}>
            <Text>TOTAL FOR PAYMENT / UKUPNO ZA UPLATU (EUR)</Text>
            <Text>{payment.amount_eur.toFixed(2)}</Text>
          </View>
        </View>

        {/* Comment Section */}
        <View style={styles.commentSection}>
          <Text style={styles.commentTitle}>COMMENT / OPIS USLUGE</Text>
          <Text style={styles.commentText}>Payment deadline is 15 days.</Text>
          <Text style={styles.commentText}>
            When making the payment, please provide the reference number / Pri plaćanju fakture navedite poziv na broj {invoiceNumber}
          </Text>
          <Text style={styles.commentText}>
            Document is valid without stamp and signature / Faktura je važeća bez pečata i potpisa
          </Text>
          <Text style={styles.commentText}>
            Place of issue / Mesto izdavanja: {config.contractor.city} {config.contractor.postalCode}
          </Text>
        </View>

        {/* Tax Exemption Note */}
        <View style={styles.taxNote}>
          <Text style={styles.taxNoteTitle}>
            NOTE ON TAX EXEMPTION / NAPOMENA O PORESKOM OSLOBOĐENJU:
          </Text>
          <Text style={styles.taxNoteText}>
            Not in the VAT system. / Poreski obveznik nije u sistemu PDV-a.
          </Text>
          <Text style={styles.taxNoteText}>
            VAT not calculated on the invoice according to article 33 of Law on value added tax. / PDV nije obračunat na fakturi u skladu sa članom 33. Zakona o porezu na dodatu vrednost.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Generate PDF invoice
 */
export async function generateInvoicePDF(payment, invoiceNumber, outputPath) {
  try {
    const blob = await pdf(<InvoiceDocument payment={payment} invoiceNumber={invoiceNumber} />).toBlob();
    const buffer = await blob.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to generate invoice PDF: ${error.message}`);
  }
}
