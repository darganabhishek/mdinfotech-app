import prisma from './prisma';

export async function generateEnrollmentNo(): Promise<string> {
  // Fetch all enrollment numbers to find the highest numeric value
  const students = await prisma.student.findMany({
    select: { enrollmentNo: true }
  });

  let maxNum = 0;

  students.forEach(s => {
    // Extract numbers from strings like "MDI26031725" or "26031724"
    const match = s.enrollmentNo.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  });

  // Increment the maximum number found or start from a baseline if none exists
  // If the institute has no students yet, we could start from 1000 or similar
  const nextNum = maxNum > 0 ? maxNum + 1 : 1001;
  
  return `MDI${nextNum}`;
}
