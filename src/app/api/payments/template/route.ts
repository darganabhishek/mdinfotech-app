import { NextResponse } from 'next/server';

export async function GET() {
  const headers = [
    'EnrollmentNo', 'CourseCode', 'Amount', 'PaymentDate', 
    'PaymentMode', 'Reference', 'Notes'
  ];

  const exampleRow = [
    '2024CS001', 'BCC', '1500', '2024-03-15', 
    'upi', 'UPI123456789', 'Monthly Installment'
  ];

  const csvData = [headers.join(','), exampleRow.join(',')].join('\n');

  return new NextResponse(csvData, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="payments_import_template.csv"',
    },
  });
}
