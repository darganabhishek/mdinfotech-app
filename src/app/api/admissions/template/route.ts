import { NextResponse } from 'next/server';

export async function GET() {
  const headers = [
    'EnrollmentNo', 'CourseCode', 'TimeSlot', 
    'AdmissionDate', 'Discount', 'Status', 'PaymentPlan', 'InstallmentAmount', 'InstallmentsCount', 'Notes'
  ];

  const exampleRow = [
    '2024CS001', 'BCC', '10:00 AM - 11:00 AM', 
    '2024-03-15', '500', 'active', 'monthly', '1500', '3', 'New admission remarks'
  ];

  const csvData = [headers.join(','), exampleRow.join(',')].join('\n');

  return new NextResponse(csvData, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="admissions_import_template.csv"',
    },
  });
}
