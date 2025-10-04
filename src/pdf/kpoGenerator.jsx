/**
 * KPO (Knjiga o ostvarenom prometu) PDF generator using React-PDF
 * Based on Serbian tax requirements for lump-sum taxed taxpayers
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';

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
    // ignore
  }
}

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    fontFamily: config.fontPath ? 'AppFont' : 'Helvetica',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: {
    width: '70%',
  },
  headerText: {
    fontSize: 9,
    marginBottom: 4,
  },
  headerBold: {
    fontSize: 9,
    fontFamily: config.fontPath ? 'AppFont' : 'Helvetica',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kpoCenter: {
    width: '30%',
    alignItems: 'flex-end',
  },
  kpoLabel: {
    fontSize: 18,
    fontFamily: config.fontPath ? 'AppFont' : 'Helvetica',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 12,
    fontFamily: config.fontPath ? 'AppFont' : 'Helvetica',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
  },
  titleLine: {
    textAlign: 'center',
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeaderTop: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
    fontSize: 7,
    fontFamily: config.fontPath ? 'AppFont' : 'Helvetica',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableHeaderBottom: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
    fontSize: 7,
    fontFamily: config.fontPath ? 'AppFont' : 'Helvetica',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    fontSize: 8,
  },
  colNum: {
    width: '8%',
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 5,
    textAlign: 'center',
    justifyContent: 'center',
  },
  colDesc: {
    width: '42%',
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 5,
    justifyContent: 'center',
  },
  colProduct: {
    width: '16%',
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 5,
    textAlign: 'right',
    justifyContent: 'center',
  },
  colServices: {
    width: '17%',
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 5,
    textAlign: 'right',
    justifyContent: 'center',
  },
  colTotal: {
    width: '17%',
    padding: 5,
    textAlign: 'right',
    justifyContent: 'center',
  },
  headerCellTall: {
    justifyContent: 'center',
    padding: 5,
    borderRightWidth: 1,
    borderColor: '#000',
  },
  headerGroup: {
    width: '33%',
    borderRightWidth: 1,
    borderColor: '#000',
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGroupRight: {
    width: '17%',
    paddingVertical: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
  },
  headerSubCell: {
    padding: 5,
    textAlign: 'center',
    borderRightWidth: 1,
    borderColor: '#000',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#f0f0f0',
    padding: 8,
    marginTop: 10,
    fontFamily: config.fontPath ? 'AppFont' : 'Helvetica',
    fontWeight: 'bold',
    fontSize: 9,
  },
  totalLabel: {
    marginRight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  footerBlock: {
    width: '45%',
    alignItems: 'center',
  },
  footerLine: {
    marginTop: 20,
    borderTopWidth: 1,
    borderColor: '#000',
    width: '80%',
  },
});

// KPO Document Component
const KpoDocument = ({ payments, year }) => {
  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const formatNumber = (num) => {
    try {
      return new Intl.NumberFormat('sr-RS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(num) || 0);
    } catch (e) {
      const fixed = (Number(num) || 0).toFixed(2);
      const parts = fixed.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${parts[0]},${parts[1]}`;
    }
  };

  const totalRsd = payments.reduce((sum, p) => sum + p.amount_rsd, 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerBold}>PIB: {config.contractor.taxId}</Text>
            <Text style={styles.headerText}>Obveznik: {config.contractor.longName}</Text>
            <Text style={styles.headerText}>Firma - radnje: {config.contractor.shortName}</Text>
            <Text style={styles.headerText}>Sedište: {config.contractor.address} {config.contractor.city} {config.contractor.postalCode}</Text>
            <Text style={styles.headerText}>Šifra poreskog obveznika: {config.contractor.registrationNumber || ''}</Text>
            <Text style={styles.headerText}>Šifra delatnosti: {config.contractor.activityCode || ''}</Text>
          </View>
          <View style={styles.kpoCenter}>
            <Text style={styles.kpoLabel}>KPO</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.title}>
          <Text style={styles.titleLine}>KNJIGA O OSTVARENOM PROMETU</Text>
          <Text style={styles.titleLine}>PAUŠALNO OPOREZOVANIH OBVEZNIKA</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Header top row with grouped columns */}
          <View style={styles.tableHeaderTop}>
            <View style={[styles.headerCellTall, { width: '8%' }]}>
              <Text>Redni</Text>
              <Text>broj</Text>
              <Text>(1)</Text>
            </View>
            <View style={[styles.headerCellTall, { width: '42%' }]}>
              <Text>Datum i opis knjiženja</Text>
              <Text>(2)</Text>
            </View>
            <View style={styles.headerGroup}>
              <Text>PRIHOD OD DELATNOSTI</Text>
            </View>
            <View style={styles.headerGroupRight}>
              <Text>SVEGA</Text>
              <Text>PRIHODI OD</Text>
              <Text>DELATNOSTI</Text>
              <Text>(3 + 4)</Text>
            </View>
          </View>

          {/* Header second row with sub columns */}
          <View style={styles.headerSubRow}>
            <View style={{ width: '8%', borderRightWidth: 1, borderColor: '#000' }} />
            <View style={{ width: '42%', borderRightWidth: 1, borderColor: '#000' }} />
            <View style={[styles.headerSubCell, { width: '16%' }]}>
              <Text>od prodaje proizvoda</Text>
              <Text>(3)</Text>
            </View>
            <View style={[styles.headerSubCell, { width: '17%' }]}>
              <Text>od izvršenih usluga</Text>
              <Text>(4)</Text>
            </View>
            <View style={{ width: '17%', padding: 5 }} />
          </View>

          {/* Table Rows */}
          {payments.map((payment, index) => (
            <View key={payment.id} style={styles.tableRow}>
              <View style={styles.colNum}>
                <Text>{index + 1}</Text>
              </View>
              <View style={styles.colDesc}>
                <Text>{formatDate(payment.date)} - {config.company.name}</Text>
              </View>
              <View style={styles.colProduct}>
                <Text>{formatNumber(0)}</Text>
              </View>
              <View style={styles.colServices}>
                <Text>{formatNumber(payment.amount_rsd)}</Text>
              </View>
              <View style={styles.colTotal}>
                <Text>{formatNumber(payment.amount_rsd)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Total Row */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>UKUPNO (RSD)</Text>
          <Text>{formatNumber(totalRsd)}</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerBlock}>
            <Text>Sastavio: {config.contractor.person}</Text>
          </View>
          <View style={styles.footerBlock}>
            <Text>Odgovorno lice: {config.contractor.person}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

/**
 * Generate KPO book PDF
 */
export async function generateKpoPDF(payments, year, outputPath) {
  try {
    const blob = await pdf(<KpoDocument payments={payments} year={year} />).toBlob();
    const buffer = await blob.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to generate KPO PDF: ${error.message}`);
  }
}
