import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { DelinquencyAccount } from '../types';

// Helper for currency formatting
const formatCurrency = (val: number | undefined | null) => {
  return `PHP ${(val || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const REPORT_DISCLAIMER_NOTE =
  'Note: The figures presented in this Statement of Account are tentative and subject to verification, reconciliation, and final approval by the authorized personnel.';

// ============================================================================
// 1. GENERATE SUMMARY REPORT - PDF
// ============================================================================
export const generateSummaryPDF = (accounts: DelinquencyAccount[], filterTitle: string = 'All Accounts') => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  const generatedAt = format(new Date(), 'MMM dd, yyyy • hh:mm:ss a');

  // Header Banner
  doc.setFillColor(6, 78, 59); // Emerald-900
  doc.rect(0, 0, 842, 60, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('AKKUN LENDING CORPORATION', 40, 26);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('DELINQUENCY MANAGEMENT — PORTFOLIO SUMMARY REPORT', 40, 44);

  // Sub-header details
  doc.setTextColor(55, 65, 81);
  doc.setFontSize(9);
  doc.text(`Generated On: ${generatedAt}`, 40, 80);
  doc.text(`Filter / Scope: ${filterTitle} (${accounts.length} Accounts)`, 40, 93);

  // Metrics summary
  const totalLoan = accounts.reduce((sum, a) => sum + (a.loanAmount || 0), 0);
  const totalPrincipal = accounts.reduce((sum, a) => sum + (a.principalBalance || 0), 0);
  const totalInterest = accounts.reduce((sum, a) => sum + (a.interestBalance || 0), 0);
  const totalPenalty = accounts.reduce((sum, a) => sum + (a.penalty || 0), 0);
  const totalPDI = accounts.reduce((sum, a) => sum + (a.pdi || 0), 0);
  const totalExposure = accounts.reduce((sum, a) => sum + (a.totalBalance || 0), 0);

  const totalCurrPrincipal = accounts.reduce((sum, a) => sum + (a.currentPrincipalDue || 0), 0);
  const totalCurrInterest = accounts.reduce((sum, a) => sum + (a.currentInterestDue || 0), 0);
  const totalCurrPenalty = accounts.reduce((sum, a) => sum + (a.currentPenalty || 0), 0);
  const totalCurrPDI = accounts.reduce((sum, a) => sum + (a.currentPdi || 0), 0);
  const totalCurrDue = accounts.reduce(
    (sum, a) =>
      sum +
      (a.currentTotalDue ??
        (a.currentPrincipalDue || 0) +
          (a.currentInterestDue || 0) +
          (a.currentPenalty || 0) +
          (a.currentPdi || 0)),
    0
  );

  const head = [[
    'Entry Date',
    'Borrower Name',
    'Tribe',
    'Address',
    'Contact',
    'Loan Amt',
    'Principal Bal.',
    'Interest Bal.',
    'Penalty',
    'PDI',
    'Total Bal.',
    'Curr. Prin. Due',
    'Curr. Int. Due',
    'Curr. Pen.',
    'Curr. PDI',
    'Total Curr. Due',
    'Field Visit',
    'Task Done',
    'Status',
    'Comms'
  ]];

  const body = accounts.map(a => {
    const entryFormatted = a.createdAt
      ? `${a.entryDate} ${format(new Date(a.createdAt), 'hh:mm a')}`
      : a.entryDate;
    const currTotal =
      a.currentTotalDue ??
      (a.currentPrincipalDue || 0) +
        (a.currentInterestDue || 0) +
        (a.currentPenalty || 0) +
        (a.currentPdi || 0);

    return [
      entryFormatted,
      a.name.toUpperCase(),
      (a.tribe || 'NCR').toUpperCase(),
      a.address,
      a.contactNumber || '-',
      (a.loanAmount || 0).toLocaleString(),
      (a.principalBalance || 0).toLocaleString(),
      (a.interestBalance || 0).toLocaleString(),
      (a.penalty || 0).toLocaleString(),
      (a.pdi || 0).toLocaleString(),
      (a.totalBalance || 0).toLocaleString(),
      (a.currentPrincipalDue || 0).toLocaleString(),
      (a.currentInterestDue || 0).toLocaleString(),
      (a.currentPenalty || 0).toLocaleString(),
      (a.currentPdi || 0).toLocaleString(),
      currTotal.toLocaleString(),
      a.fieldVisited ? `YES (${a.fieldVisitDate ? format(new Date(a.fieldVisitDate), 'MM/dd') : 'Done'})` : 'NO',
      a.taskCompleted ? `YES (${a.taskCompletedDate ? format(new Date(a.taskCompletedDate), 'MM/dd') : 'Done'})` : 'NO',
      a.status.toUpperCase(),
      a.communications?.length || 0
    ];
  });

  // Footer total row
  const foot = [[
    'TOTAL',
    `Count: ${accounts.length}`,
    '',
    '',
    '',
    totalLoan.toLocaleString(),
    totalPrincipal.toLocaleString(),
    totalInterest.toLocaleString(),
    totalPenalty.toLocaleString(),
    totalPDI.toLocaleString(),
    totalExposure.toLocaleString(),
    totalCurrPrincipal.toLocaleString(),
    totalCurrInterest.toLocaleString(),
    totalCurrPenalty.toLocaleString(),
    totalCurrPDI.toLocaleString(),
    totalCurrDue.toLocaleString(),
    `${accounts.filter(a => a.fieldVisited).length} Visited`,
    `${accounts.filter(a => a.taskCompleted).length} Done`,
    '',
    accounts.reduce((s, a) => s + (a.communications?.length || 0), 0)
  ]];

  autoTable(doc, {
    head,
    body,
    foot,
    startY: 105,
    margin: { left: 24, right: 24, bottom: 55 },
    theme: 'grid',
    styles: {
      cellPadding: 2.5,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [6, 95, 70],
      textColor: [255, 255, 255],
      fontSize: 6.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [31, 41, 55]
    },
    footStyles: {
      fillColor: [243, 244, 246],
      textColor: [17, 24, 39],
      fontStyle: 'bold',
      fontSize: 6.5
    },
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 56, fontStyle: 'bold' },
      2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 58 },
      4: { cellWidth: 40 },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right' },
      10: { halign: 'right', fontStyle: 'bold', textColor: [185, 28, 28] },
      11: { halign: 'right', textColor: [5, 150, 105] },
      12: { halign: 'right', textColor: [13, 148, 136] },
      13: { halign: 'right', textColor: [180, 83, 9] },
      14: { halign: 'right', textColor: [126, 34, 206] },
      15: { halign: 'right', fontStyle: 'bold', textColor: [67, 56, 202] },
      16: { cellWidth: 36, halign: 'center', fontSize: 6 },
      17: { cellWidth: 36, halign: 'center', fontSize: 6 },
      18: { cellWidth: 36, halign: 'center' },
      19: { cellWidth: 24, halign: 'center' }
    }
  });

  // Render Note at the very bottom of the report
  let noteY = ((doc as any).lastAutoTable?.finalY || 120) + 18;
  if (noteY > 525) {
    doc.addPage();
    noteY = 48;
  }
  const wrappedNote = doc.splitTextToSize(REPORT_DISCLAIMER_NOTE, 774);
  const noteBoxHeight = wrappedNote.length * 12 + 16;
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(24, noteY, 794, noteBoxHeight, 4, 4, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  doc.text(wrappedNote, 34, noteY + 14);

  // Page numbering footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${totalPages} • Confidential Document — Akkun Lending Corporation`,
      24,
      580
    );
  }

  doc.save(`Delinquency_Summary_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

// ============================================================================
// 2. GENERATE SUMMARY REPORT - EXCEL
// ============================================================================
export const generateSummaryExcel = (accounts: DelinquencyAccount[]) => {
  const data = accounts.map((a, idx) => ({
    'No.': idx + 1,
    'Entry Date': a.entryDate,
    'Entry Time': a.createdAt ? format(new Date(a.createdAt), 'hh:mm:ss a') : '',
    'Borrower Name': a.name,
    'Tribe': a.tribe || 'NCR',
    'Address': a.address,
    'Contact Number': a.contactNumber || 'N/A',
    'Loan Amount (PHP)': a.loanAmount || 0,
    'Principal Balance (PHP)': a.principalBalance || 0,
    'Interest Balance (PHP)': a.interestBalance || 0,
    'Penalty (PHP)': a.penalty || 0,
    'PDI (PHP)': a.pdi || 0,
    'Total Balance (PHP)': a.totalBalance || 0,
    'Current Principal Due (PHP)': a.currentPrincipalDue || 0,
    'Current Interest Due (PHP)': a.currentInterestDue || 0,
    'Current Penalty (PHP)': a.currentPenalty || 0,
    'Current PDI (PHP)': a.currentPdi || 0,
    'Total Current Due (PHP)':
      a.currentTotalDue ??
      (a.currentPrincipalDue || 0) +
        (a.currentInterestDue || 0) +
        (a.currentPenalty || 0) +
        (a.currentPdi || 0),
    'Field Visited': a.fieldVisited ? 'YES' : 'NO',
    'Field Visit Date': a.fieldVisitDate ? format(new Date(a.fieldVisitDate), 'yyyy-MM-dd HH:mm') : 'N/A',
    'Field Visit Officer': a.fieldVisitOfficerName || 'N/A',
    'Task Completed': a.taskCompleted ? 'YES' : 'NO',
    'Task Completed Date': a.taskCompletedDate ? format(new Date(a.taskCompletedDate), 'yyyy-MM-dd HH:mm') : 'N/A',
    'Completed By': a.taskCompletedByName || 'N/A',
    'Status': a.status,
    'Communications Count': a.communications?.length || 0,
    'Registered By': `${a.createdByName || 'N/A'} (${a.createdByRole || 'user'})`
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },  // No
    { wch: 12 }, // Entry Date
    { wch: 12 }, // Entry Time
    { wch: 25 }, // Name
    { wch: 12 }, // Tribe
    { wch: 30 }, // Address
    { wch: 15 }, // Contact
    { wch: 18 }, // Loan Amount
    { wch: 20 }, // Principal
    { wch: 18 }, // Interest
    { wch: 15 }, // Penalty
    { wch: 15 }, // PDI
    { wch: 20 }, // Total Balance
    { wch: 24 }, // Current Principal Due
    { wch: 24 }, // Current Interest Due
    { wch: 20 }, // Current Penalty
    { wch: 18 }, // Current PDI
    { wch: 22 }, // Total Current Due
    { wch: 12 }, // Field Visited
    { wch: 18 }, // Field Visit Date
    { wch: 20 }, // Field Visit Officer
    { wch: 14 }, // Task Completed
    { wch: 18 }, // Task Completed Date
    { wch: 20 }, // Completed By
    { wch: 16 }, // Status
    { wch: 16 }, // Comms Count
    { wch: 22 }  // Registered By
  ];

  XLSX.utils.sheet_add_aoa(worksheet, [[], [REPORT_DISCLAIMER_NOTE]], { origin: -1 });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Delinquency Summary');

  XLSX.writeFile(workbook, `Delinquency_Summary_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
};

// ============================================================================
// 3. GENERATE INDIVIDUAL CLIENT REPORT - PDF
// ============================================================================
export const generateIndividualPDF = (account: DelinquencyAccount) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const generatedAt = format(new Date(), 'MMMM dd, yyyy • hh:mm:ss a');

  // Header Banner
  doc.setFillColor(6, 78, 59); // Emerald-900
  doc.rect(0, 0, 595, 65, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('AKKUN LENDING CORPORATION', 36, 28);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('INDIVIDUAL DELINQUENT ACCOUNT DOSSIER & COMMUNICATION AUDIT', 36, 46);

  let currentY = 85;

  // Title & Basic Coordinates Box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(36, currentY, 523, 72, 6, 6, 'F');
  doc.setDrawColor(229, 231, 235);
  doc.roundedRect(36, currentY, 523, 72, 6, 6, 'S');

  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(account.name.toUpperCase(), 48, currentY + 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(75, 85, 99);
  doc.text(`Tribe: ${(account.tribe || 'NCR').toUpperCase()}  •  Address: ${account.address}`, 48, currentY + 38);
  doc.text(`Contact: ${account.contactNumber || 'N/A'}  •  Account ID: ${account.id}`, 48, currentY + 52);
  doc.text(`Status: ${account.status.toUpperCase()}  •  Created By: ${account.createdByName} (${account.createdByRole})`, 48, currentY + 65);

  currentY += 86;

  // Section 1: Progress Line & Timestamps
  doc.setTextColor(6, 78, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. PROGRESS TIMELINE & AUDIT MILESTONES', 36, currentY);

  currentY += 10;

  const progressData = [
    [
      'Date of Entry (with Time)',
      `${account.entryDate} at ${account.createdAt ? format(new Date(account.createdAt), 'hh:mm:ss a') : 'Recorded'}`,
      'INITIAL ENTRY',
      `Registered by ${account.createdByName}`
    ],
    [
      'Field Visited',
      account.fieldVisited
        ? `${account.fieldVisitDate ? format(new Date(account.fieldVisitDate), 'MMM dd, yyyy • hh:mm:ss a') : 'YES'}`
        : 'PENDING FIELD VISIT',
      account.fieldVisited ? 'COMPLETED' : 'PENDING',
      account.fieldVisitOfficerName ? `Officer: ${account.fieldVisitOfficerName}` : 'No visit logged'
    ],
    [
      'Task Completed',
      account.taskCompleted
        ? `${account.taskCompletedDate ? format(new Date(account.taskCompletedDate), 'MMM dd, yyyy • hh:mm:ss a') : 'YES'}`
        : 'IN PROGRESS / ACTIVE RECOVERY',
      account.taskCompleted ? 'RESOLVED / SETTLED' : 'ACTIVE',
      account.taskCompletedByName ? `Completed by: ${account.taskCompletedByName}` : 'Recovery ongoing'
    ]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Milestone Step', 'Timestamp & Schedule', 'Status', 'Verification Details']],
    body: progressData,
    margin: { left: 36, right: 36 },
    theme: 'grid',
    headStyles: {
      fillColor: [6, 95, 70],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [31, 41, 55]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 130 },
      1: { cellWidth: 160 },
      2: { cellWidth: 90, halign: 'center' },
      3: { cellWidth: 143 }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 18;

  // Section 2: Financial Balances Breakdown
  doc.setTextColor(6, 78, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2. OBLIGATION & BALANCE BREAKDOWN (PHP)', 36, currentY);

  currentY += 10;

  const financialData = [
    ['Original Loan Amount', formatCurrency(account.loanAmount)],
    ['Principal Balance', formatCurrency(account.principalBalance)],
    ['Interest Balance', formatCurrency(account.interestBalance)],
    ['Penalty Amount', formatCurrency(account.penalty)],
    ['PDI (Past Due Interest)', formatCurrency(account.pdi)],
    ['TOTAL OUTSTANDING BALANCE', formatCurrency(account.totalBalance)]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Financial Balance Metric', 'Amount (PHP)']],
    body: financialData,
    margin: { left: 36, right: 36 },
    theme: 'grid',
    headStyles: {
      fillColor: [6, 95, 70],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [31, 41, 55]
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.row.index === 5) {
        data.cell.styles.fillColor = [254, 242, 242]; // red-50
        data.cell.styles.textColor = [185, 28, 28]; // red-700
        data.cell.styles.fontSize = 9.5;
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 18;

  // Section 2B: Current Due Breakdown
  const currentTotalDueVal =
    account.currentTotalDue ??
    (account.currentPrincipalDue || 0) +
      (account.currentInterestDue || 0) +
      (account.currentPenalty || 0) +
      (account.currentPdi || 0);

  doc.setTextColor(6, 78, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('2B. CURRENT DUE BREAKDOWN (PHP)', 36, currentY);

  currentY += 10;

  const currentDueData = [
    ['Current Principal Due', formatCurrency(account.currentPrincipalDue)],
    ['Current Interest Due', formatCurrency(account.currentInterestDue)],
    ['Current Penalty', formatCurrency(account.currentPenalty)],
    ['Current PDI (Past Due Interest)', formatCurrency(account.currentPdi)],
    ['TOTAL CURRENT AMOUNT DUE', formatCurrency(currentTotalDueVal)]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Current Due Metric', 'Amount (PHP)']],
    body: currentDueData,
    margin: { left: 36, right: 36 },
    theme: 'grid',
    headStyles: {
      fillColor: [67, 56, 202],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [31, 41, 55]
    },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.row.index === 4) {
        data.cell.styles.fillColor = [238, 242, 255]; // indigo-50
        data.cell.styles.textColor = [67, 56, 202]; // indigo-700
        data.cell.styles.fontSize = 9.5;
      }
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 18;

  // Section 2.5: Payments & Balance Reduction Audit Trail
  const paymentsList = account.payments || [];
  if (paymentsList.length > 0) {
    doc.setTextColor(6, 78, 59);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(`2.5. PAYMENT COLLECTIONS & BALANCE REDUCTION HISTORY (${paymentsList.length} Payments)`, 36, currentY);
    currentY += 10;

    const paymentRows = paymentsList.map(p => [
      p.paymentDate,
      p.orNumber || '-',
      p.paymentMethod || 'Cash',
      formatCurrency(p.amount),
      formatCurrency(p.principalPaid),
      formatCurrency(p.interestPaid),
      `${p.recordedByName || '-'}
(${p.recordedByRole || 'user'})`,
      p.remarks || '-'
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Date', 'OR / Ref', 'Method', 'Total Paid', 'Principal Paid', 'Interest Paid', 'Received By', 'Remarks']],
      body: paymentRows,
      margin: { left: 36, right: 36 },
      theme: 'grid',
      headStyles: {
        fillColor: [5, 150, 105],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [31, 41, 55]
      },
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 55 },
        2: { cellWidth: 55 },
        3: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { cellWidth: 70 },
        7: { cellWidth: 90 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 18;
  }

  // Section 3: All Communications & Remarks Audit Trail
  doc.setTextColor(6, 78, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`3. COMMUNICATION LOGS & REMARKS AUDIT TRAIL (${account.communications?.length || 0} Records)`, 36, currentY);

  currentY += 10;

  const commsRows = (account.communications || []).map(c => [
    format(new Date(c.timestamp), 'MMM dd, yyyy • hh:mm a'),
    c.type.toUpperCase(),
    `${c.userName}\n(${c.userRole})`,
    c.promiseToPay ? `PTP: ${c.promiseToPay}` : 'None',
    c.remarks
  ]);

  if (commsRows.length === 0) {
    commsRows.push([
      'N/A',
      'No Interactions',
      '-',
      '-',
      'No communication remarks recorded yet for this account.'
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [['Date & Time', 'Channel', 'Logged By', 'Promise to Pay', 'Remarks & Conversation Details']],
    body: commsRows,
    margin: { left: 36, right: 36, bottom: 55 },
    theme: 'grid',
    headStyles: {
      fillColor: [6, 95, 70],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [31, 41, 55]
    },
    columnStyles: {
      0: { cellWidth: 95 },
      1: { cellWidth: 65, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 80, fontStyle: 'bold' },
      3: { cellWidth: 95, textColor: [180, 83, 9] },
      4: { cellWidth: 188 }
    }
  });

  // Render Note at the very bottom of the individual report
  let noteY = ((doc as any).lastAutoTable?.finalY || currentY) + 18;
  if (noteY > 755) {
    doc.addPage();
    noteY = 48;
  }
  const wrappedNote = doc.splitTextToSize(REPORT_DISCLAIMER_NOTE, 503);
  const noteBoxHeight = wrappedNote.length * 12 + 16;
  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(209, 213, 219);
  doc.roundedRect(36, noteY, 523, noteBoxHeight, 4, 4, 'FD');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(55, 65, 81);
  doc.text(wrappedNote, 46, noteY + 14);

  // Page numbering footer on all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${totalPages} • Generated on ${generatedAt} • Akkun Lending Corporation`,
      36,
      820
    );
  }

  const safeFileName = account.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Delinquency_Client_${safeFileName}_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
};

// ============================================================================
// 4. GENERATE INDIVIDUAL CLIENT REPORT - EXCEL
// ============================================================================
export const generateIndividualExcel = (account: DelinquencyAccount) => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Account Profile & Balances
  const profileRows = [
    { 'Attribute': 'AKKUN LENDING CORPORATION - DELINQUENCY CLIENT REPORT', 'Value': '' },
    { 'Attribute': 'Generated On', 'Value': format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
    { 'Attribute': '', 'Value': '' },
    { 'Attribute': 'ACCOUNT IDENTIFICATION', 'Value': '' },
    { 'Attribute': 'Account ID', 'Value': account.id },
    { 'Attribute': 'Borrower Name', 'Value': account.name },
    { 'Attribute': 'Tribe', 'Value': account.tribe || 'NCR' },
    { 'Attribute': 'Address', 'Value': account.address },
    { 'Attribute': 'Contact Number', 'Value': account.contactNumber || 'N/A' },
    { 'Attribute': 'Status', 'Value': account.status },
    { 'Attribute': 'Registered By', 'Value': `${account.createdByName} (${account.createdByRole})` },
    { 'Attribute': '', 'Value': '' },
    { 'Attribute': 'PROGRESS TIMELINE', 'Value': '' },
    { 'Attribute': 'Date of Entry', 'Value': `${account.entryDate} ${account.createdAt ? format(new Date(account.createdAt), 'HH:mm:ss') : ''}` },
    { 'Attribute': 'Field Visited', 'Value': account.fieldVisited ? 'YES' : 'NO' },
    { 'Attribute': 'Field Visit Timestamp', 'Value': account.fieldVisitDate ? format(new Date(account.fieldVisitDate), 'yyyy-MM-dd HH:mm:ss') : 'N/A' },
    { 'Attribute': 'Field Visit Officer', 'Value': account.fieldVisitOfficerName || 'N/A' },
    { 'Attribute': 'Task Completed', 'Value': account.taskCompleted ? 'YES' : 'NO' },
    { 'Attribute': 'Task Completed Timestamp', 'Value': account.taskCompletedDate ? format(new Date(account.taskCompletedDate), 'yyyy-MM-dd HH:mm:ss') : 'N/A' },
    { 'Attribute': 'Task Completed By', 'Value': account.taskCompletedByName || 'N/A' },
    { 'Attribute': '', 'Value': '' },
    { 'Attribute': 'FINANCIAL BALANCES (PHP)', 'Value': '' },
    { 'Attribute': 'Original Loan Amount', 'Value': account.loanAmount || 0 },
    { 'Attribute': 'Principal Balance', 'Value': account.principalBalance || 0 },
    { 'Attribute': 'Interest Balance', 'Value': account.interestBalance || 0 },
    { 'Attribute': 'Penalty', 'Value': account.penalty || 0 },
    { 'Attribute': 'PDI (Past Due Interest)', 'Value': account.pdi || 0 },
    { 'Attribute': 'TOTAL OUTSTANDING BALANCE', 'Value': account.totalBalance || 0 },
    { 'Attribute': '', 'Value': '' },
    { 'Attribute': 'CURRENT DUE BREAKDOWN (PHP)', 'Value': '' },
    { 'Attribute': 'Current Principal Due', 'Value': account.currentPrincipalDue || 0 },
    { 'Attribute': 'Current Interest Due', 'Value': account.currentInterestDue || 0 },
    { 'Attribute': 'Current Penalty', 'Value': account.currentPenalty || 0 },
    { 'Attribute': 'Current PDI', 'Value': account.currentPdi || 0 },
    {
      'Attribute': 'TOTAL CURRENT AMOUNT DUE',
      'Value':
        account.currentTotalDue ??
        (account.currentPrincipalDue || 0) +
          (account.currentInterestDue || 0) +
          (account.currentPenalty || 0) +
          (account.currentPdi || 0)
    },
    { 'Attribute': '', 'Value': '' },
    { 'Attribute': REPORT_DISCLAIMER_NOTE, 'Value': '' }
  ];

  const profileSheet = XLSX.utils.json_to_sheet(profileRows);
  profileSheet['!cols'] = [{ wch: 30 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(workbook, profileSheet, 'Client Profile & Balances');

  // Sheet 2: Communications & Remarks Ledger
  const commsRows = (account.communications || []).map((c, idx) => ({
    'No.': idx + 1,
    'Date': format(new Date(c.timestamp), 'yyyy-MM-dd'),
    'Time': format(new Date(c.timestamp), 'hh:mm:ss a'),
    'Channel / Type': c.type,
    'Officer / User Name': c.userName,
    'User Role': c.userRole,
    'Promise to Pay (PTP)': c.promiseToPay || 'None',
    'Conversation Remarks & Notes': c.remarks
  }));

  const commsSheet = XLSX.utils.json_to_sheet(commsRows);
  commsSheet['!cols'] = [
    { wch: 5 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 22 },
    { wch: 15 },
    { wch: 25 },
    { wch: 50 }
  ];
  XLSX.utils.sheet_add_aoa(commsSheet, [[], [REPORT_DISCLAIMER_NOTE]], { origin: -1 });
  XLSX.utils.book_append_sheet(workbook, commsSheet, 'Communications Ledger');

  // Sheet 3: Payments & Collections Ledger
  const paymentRows = (account.payments || []).map((p, idx) => ({
    'Payment #': idx + 1,
    'Payment Date': p.paymentDate,
    'OR / Reference No.': p.orNumber || 'N/A',
    'Payment Method': p.paymentMethod || 'Cash',
    'Total Amount Paid (PHP)': p.amount || 0,
    'Principal Paid (PHP)': p.principalPaid || 0,
    'Interest Paid (PHP)': p.interestPaid || 0,
    'Penalty Paid (PHP)': p.penaltyPaid || 0,
    'PDI Paid (PHP)': p.pdiPaid || 0,
    'Recorded By': `${p.recordedByName} (${p.recordedByRole})`,
    'Timestamp': p.timestamp,
    'Notes / Remarks': p.remarks || ''
  }));

  const paymentsSheet = XLSX.utils.json_to_sheet(paymentRows);
  paymentsSheet['!cols'] = [
    { wch: 10 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
    { wch: 22 },
    { wch: 35 }
  ];
  XLSX.utils.sheet_add_aoa(paymentsSheet, [[], [REPORT_DISCLAIMER_NOTE]], { origin: -1 });
  XLSX.utils.book_append_sheet(workbook, paymentsSheet, 'Payments & Reductions');

  const safeFileName = account.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  XLSX.writeFile(workbook, `Delinquency_Client_${safeFileName}_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
};
