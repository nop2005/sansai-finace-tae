import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register Thai font from local files
Font.register({
  family: 'Sarabun',
  fonts: [
    {
      src: '/fonts/Sarabun-Regular.ttf',
      fontWeight: 400,
    },
    {
      src: '/fonts/Sarabun-Bold.ttf',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Sarabun',
    fontSize: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    marginTop: 15,
  },
  table: {
    width: '100%',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 5,
    marginBottom: 5,
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  categoryRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    backgroundColor: '#f9fafb',
    fontWeight: 700,
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderTopWidth: 2,
    borderTopColor: '#000',
    fontWeight: 700,
    marginTop: 5,
  },
  col1: {
    width: '40%',
    paddingLeft: 5,
  },
  col2: {
    width: '40%',
    paddingLeft: 5,
  },
  col3: {
    width: '20%',
    textAlign: 'right',
    paddingRight: 5,
  },
  itemRow: {
    paddingLeft: 15,
  },
  summarySection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f9fafb',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  summaryLabel: {
    fontSize: 11,
  },
  summaryValue: {
    fontSize: 11,
    fontWeight: 700,
  },
});

interface MonthlyReportPDFProps {
  monthName: string;
  year: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeByCategory: Array<{
    category: { name: string };
    items: Array<{ name: string; total: number }>;
  }>;
  expenseByCategory: Array<{
    category: { name: string };
    items: Array<{ name: string; total: number }>;
  }>;
}

export const MonthlyReportPDF = ({
  monthName,
  year,
  totalIncome,
  totalExpense,
  balance,
  incomeByCategory,
  expenseByCategory,
}: MonthlyReportPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Title */}
      <Text style={styles.title}>
        สรุปบัญชีประจำเดือน {monthName} {year}
      </Text>

      {/* Income Section */}
      <Text style={styles.sectionTitle}>รายละเอียดรายรับ</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>หมวดรายรับ</Text>
          <Text style={styles.col2}>รายการรายรับ</Text>
          <Text style={styles.col3}>เดือน {monthName} {year}</Text>
        </View>
        
        {incomeByCategory.map((categoryData, catIndex) => (
          <View key={`income-cat-${catIndex}`}>
            <View style={styles.categoryRow}>
              <Text style={[styles.col1, styles.col2]}>
                {catIndex + 1}. {categoryData.category.name}
              </Text>
              <Text style={styles.col3}></Text>
            </View>
            {categoryData.items.map((item, itemIndex) => (
              <View key={`income-item-${itemIndex}`} style={styles.tableRow}>
                <Text style={styles.col1}></Text>
                <Text style={[styles.col2, styles.itemRow]}>
                  {catIndex + 1}.{itemIndex + 1} {item.name}
                </Text>
                <Text style={styles.col3}>
                  {item.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
          </View>
        ))}
        
        <View style={styles.totalRow}>
          <Text style={[styles.col1, styles.col2]}>รวมรายรับทั้งหมด</Text>
          <Text style={styles.col3}>
            {totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Expense Section */}
      <Text style={styles.sectionTitle}>รายละเอียดรายจ่าย</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>หมวดรายจ่าย</Text>
          <Text style={styles.col2}>รายการรายจ่าย</Text>
          <Text style={styles.col3}>เดือน {monthName} {year}</Text>
        </View>
        
        {expenseByCategory.map((categoryData, catIndex) => (
          <View key={`expense-cat-${catIndex}`}>
            <View style={styles.categoryRow}>
              <Text style={[styles.col1, styles.col2]}>
                {catIndex + 1}. {categoryData.category.name}
              </Text>
              <Text style={styles.col3}></Text>
            </View>
            {categoryData.items.map((item, itemIndex) => (
              <View key={`expense-item-${itemIndex}`} style={styles.tableRow}>
                <Text style={styles.col1}></Text>
                <Text style={[styles.col2, styles.itemRow]}>
                  {catIndex + 1}.{itemIndex + 1} {item.name}
                </Text>
                <Text style={styles.col3}>
                  {item.total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
          </View>
        ))}
        
        <View style={styles.totalRow}>
          <Text style={[styles.col1, styles.col2]}>รวมรายจ่ายทั้งหมด</Text>
          <Text style={styles.col3}>
            {totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summarySection}>
        <Text style={[styles.sectionTitle, { marginTop: 0 }]}>สรุป</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>รายรับรวม:</Text>
          <Text style={styles.summaryValue}>
            {totalIncome.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>รายจ่ายรวม:</Text>
          <Text style={styles.summaryValue}>
            {totalExpense.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>เงินคงเหลือ:</Text>
          <Text style={styles.summaryValue}>
            {balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
          </Text>
        </View>
      </View>
    </Page>
  </Document>
);
