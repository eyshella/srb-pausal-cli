/**
 * KPO (Knjiga o ostvarenom prometu) PDF generator using React-PDF
 * Based on Serbian tax requirements for lump-sum taxed taxpayers
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import fs from 'fs';
import { config } from '../config.js';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 8,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerLeft: {
    width: '70%',
  },
  headerText: {
    fontSize: 8,
    marginBottom: 3,
  },
  headerBold: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  kpoLabel: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  titleLine: {
    textAlign: 'center',
    marginBottom: 3,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f5f5f5',
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
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
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#f0f0f0',
    padding: 8,
    marginTop: 10,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
  },
  totalLabel: {
    marginRight: 20,
  },
});

// KPO Document Component
const KpoDocument = ({ payments, year }) => {
  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  };

  const formatNumber = (num) => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace('.', ',');
  };

  const totalRsd = payments.reduce((sum, p) => sum + p.amount_rsd, 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerBold}>PIB: {config.contractor.taxId}</Text>
            <Text style={styles.headerText}>
              Taxpayer: {config.contractor.companyRegistration || config.contractor.name}
            </Text>
            <Text style={styles.headerText}>Company Name: {config.contractor.name}</Text>
            <Text style={styles.headerText}>
              Address: {config.contractor.address} {config.contractor.city} {config.contractor.postalCode}
            </Text>
            <Text style={styles.headerText}>
              Identification Number: {config.contractor.registrationNumber || ''}
            </Text>
            <Text style={styles.headerText}>
              Activity Code: {config.contractor.activityCode || '6201 Računarsko programiranje'}
            </Text>
          </View>
          <View>
            <Text style={styles.kpoLabel}>KPO</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.title}>
          <Text style={styles.titleLine}>Book of realized turnover</Text>
          <Text style={styles.titleLine}>for lump sum taxed</Text>
          <Text style={styles.titleLine}>taxpayers</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.colNum}>
              <Text>SERIAL</Text>
              <Text>NUMBER</Text>
            </View>
            <View style={styles.colDesc}>
              <Text>DATE AND DESCRIPTION OF BOOKING</Text>
            </View>
            <View style={styles.colProduct}>
              <Text>REVENUE FROM</Text>
              <Text>PRODUCT SALES</Text>
            </View>
            <View style={styles.colServices}>
              <Text>REVENUE FROM</Text>
              <Text>RENDERED SERVICES</Text>
            </View>
            <View style={styles.colTotal}>
              <Text>TOTAL INCOME FROM</Text>
              <Text>ACTIVITIES</Text>
            </View>
          </View>

          {/* Table Rows */}
          {payments.map((payment, index) => (
            <View key={payment.id} style={styles.tableRow}>
              <View style={styles.colNum}>
                <Text>{index + 1}</Text>
              </View>
              <View style={styles.colDesc}>
                <Text>{config.company.name} {formatDate(payment.date)}</Text>
              </View>
              <View style={styles.colProduct}>
                <Text>0,00</Text>
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
          <Text style={styles.totalLabel}>TOTAL (RSD)</Text>
          <Text>{formatNumber(totalRsd)}</Text>
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
