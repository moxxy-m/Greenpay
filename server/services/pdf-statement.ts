import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  type: string;
  amount: string;
  currency: string;
  status: string;
  description: string;
  fee?: string;
  createdAt: Date | string;
  recipient?: string;
  sender?: string;
}

interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
}

interface StatementOptions {
  startDate?: Date;
  endDate?: Date;
  includePersonalInfo?: boolean;
  title?: string;
}

class PDFStatementService {
  private formatCurrency(amount: string | number, currency: string = 'USD'): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${currency} ${num.toFixed(2)}`;
  }

  private formatDate(date: Date | string): string {
    return format(new Date(date), 'MMM dd, yyyy HH:mm');
  }

  private getTransactionColor(type: string): [number, number, number] {
    switch (type) {
      case 'receive':
      case 'deposit':
        return [34, 197, 94]; // Green
      case 'send':
      case 'withdraw':
        return [239, 68, 68]; // Red
      case 'card_purchase':
        return [59, 130, 246]; // Blue
      default:
        return [107, 114, 128]; // Gray
    }
  }

  async generateUserStatement(
    user: User, 
    transactions: Transaction[], 
    options: StatementOptions = {}
  ): Promise<Buffer> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(34, 197, 94); // Green
    doc.text('GreenPay', 20, yPos);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(options.title || 'Transaction Statement', 20, yPos + 15);
    
    yPos += 35;

    // User Information (if enabled)
    if (options.includePersonalInfo !== false) {
      doc.setFontSize(12);
      doc.text(`Account Holder: ${user.fullName}`, 20, yPos);
      doc.text(`Email: ${user.email}`, 20, yPos + 7);
      if (user.phone) {
        doc.text(`Phone: ${user.phone}`, 20, yPos + 14);
      }
      yPos += 25;
    }

    // Date Range
    if (options.startDate || options.endDate) {
      let dateRange = 'Statement Period: ';
      if (options.startDate) {
        dateRange += `From ${format(options.startDate, 'MMM dd, yyyy')}`;
      }
      if (options.endDate) {
        dateRange += ` To ${format(options.endDate, 'MMM dd, yyyy')}`;
      }
      doc.setFontSize(10);
      doc.text(dateRange, 20, yPos);
      yPos += 15;
    }

    // Summary
    const totalCredits = transactions
      .filter(t => ['receive', 'deposit'].includes(t.type))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalDebits = transactions
      .filter(t => ['send', 'withdraw'].includes(t.type))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalFees = transactions
      .reduce((sum, t) => sum + parseFloat(t.fee || '0'), 0);

    doc.setFontSize(12);
    doc.text('Summary:', 20, yPos);
    yPos += 10;

    const summaryData = [
      ['Total Credits', this.formatCurrency(totalCredits)],
      ['Total Debits', this.formatCurrency(totalDebits)],
      ['Total Fees', this.formatCurrency(totalFees)],
      ['Net Amount', this.formatCurrency(totalCredits - totalDebits - totalFees)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Amount']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 10 }
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;

    // Transactions Table
    if (transactions.length > 0) {
      doc.setFontSize(12);
      doc.text('Transaction Details:', 20, yPos);
      yPos += 10;

      const tableData = transactions.map(transaction => [
        this.formatDate(transaction.createdAt),
        transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
        transaction.description || 'N/A',
        this.formatCurrency(transaction.amount, transaction.currency),
        transaction.fee ? this.formatCurrency(transaction.fee) : 'Free',
        transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Type', 'Description', 'Amount', 'Fee', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 20 },
          2: { cellWidth: 40 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 }
        },
        didParseCell: (data) => {
          if (data.row.index >= 0 && data.column.index === 1) {
            const transaction = transactions[data.row.index];
            if (transaction) {
              const color = this.getTransactionColor(transaction.type);
              data.cell.styles.textColor = color;
            }
          }
        }
      });
    } else {
      doc.text('No transactions found for the selected period.', 20, yPos);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, pageHeight - 20);
    doc.text('GreenPay - Secure International Money Transfers', 20, pageHeight - 10);
    
    // Page number
    doc.text(`Page 1`, pageWidth - 30, pageHeight - 10);

    return Buffer.from(doc.output('arraybuffer'));
  }

  async generateAdminStatement(
    transactions: Transaction[],
    options: StatementOptions & { adminName?: string } = {}
  ): Promise<Buffer> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPos = 20;

    // Header
    doc.setFontSize(24);
    doc.setTextColor(34, 197, 94); // Green
    doc.text('GreenPay', 20, yPos);
    
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('Admin Transaction Report', 20, yPos + 15);
    
    if (options.adminName) {
      doc.setFontSize(12);
      doc.text(`Generated by: ${options.adminName}`, 20, yPos + 25);
      yPos += 35;
    } else {
      yPos += 30;
    }

    // Date Range
    if (options.startDate || options.endDate) {
      let dateRange = 'Report Period: ';
      if (options.startDate) {
        dateRange += `From ${format(options.startDate, 'MMM dd, yyyy')}`;
      }
      if (options.endDate) {
        dateRange += ` To ${format(options.endDate, 'MMM dd, yyyy')}`;
      }
      doc.setFontSize(10);
      doc.text(dateRange, 20, yPos);
      yPos += 15;
    }

    // Analytics
    const analytics = {
      totalTransactions: transactions.length,
      completedTransactions: transactions.filter(t => t.status === 'completed').length,
      pendingTransactions: transactions.filter(t => t.status === 'pending').length,
      failedTransactions: transactions.filter(t => t.status === 'failed').length,
      totalVolume: transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0),
      totalFees: transactions
        .reduce((sum, t) => sum + parseFloat(t.fee || '0'), 0),
      byType: {
        send: transactions.filter(t => t.type === 'send').length,
        receive: transactions.filter(t => t.type === 'receive').length,
        deposit: transactions.filter(t => t.type === 'deposit').length,
        withdraw: transactions.filter(t => t.type === 'withdraw').length,
        card_purchase: transactions.filter(t => t.type === 'card_purchase').length
      }
    };

    // Summary Section
    doc.setFontSize(14);
    doc.text('Report Summary:', 20, yPos);
    yPos += 10;

    const summaryData = [
      ['Total Transactions', analytics.totalTransactions.toString()],
      ['Completed', analytics.completedTransactions.toString()],
      ['Pending', analytics.pendingTransactions.toString()],
      ['Failed', analytics.failedTransactions.toString()],
      ['Total Volume', this.formatCurrency(analytics.totalVolume)],
      ['Total Fees Collected', this.formatCurrency(analytics.totalFees)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] },
      margin: { left: 20, right: pageWidth / 2 },
      styles: { fontSize: 10 }
    });

    // Transaction Type Breakdown
    const typeData = Object.entries(analytics.byType).map(([type, count]) => [
      type.charAt(0).toUpperCase() + type.slice(1),
      count.toString()
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Transaction Type', 'Count']],
      body: typeData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: pageWidth / 2 + 10, right: 20 },
      styles: { fontSize: 10 }
    });

    yPos = Math.max((doc as any).lastAutoTable.finalY) + 20;

    // Detailed Transactions
    if (transactions.length > 0) {
      doc.setFontSize(14);
      doc.text('Transaction Details:', 20, yPos);
      yPos += 10;

      const tableData = transactions.map(transaction => [
        transaction.id.substring(0, 8),
        this.formatDate(transaction.createdAt),
        transaction.type,
        this.formatCurrency(transaction.amount, transaction.currency),
        transaction.fee ? this.formatCurrency(transaction.fee) : '0.00',
        transaction.status,
        (transaction.description || '').substring(0, 30)
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['ID', 'Date', 'Type', 'Amount', 'Fee', 'Status', 'Description']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [34, 197, 94] },
        margin: { left: 20, right: 20 },
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 30 }
        }
      });
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 20, pageHeight - 20);
    doc.text('GreenPay Admin Portal - Confidential Report', 20, pageHeight - 10);
    doc.text(`Page 1`, pageWidth - 30, pageHeight - 10);

    return Buffer.from(doc.output('arraybuffer'));
  }
}

export const pdfStatementService = new PDFStatementService();