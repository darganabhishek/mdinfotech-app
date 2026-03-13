const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const timeSlots = [
    { startTime: '09:00', endTime: '10:00', label: '09:00 AM - 10:00 AM' },
    { startTime: '10:00', endTime: '11:00', label: '10:00 AM - 11:00 AM' },
    { startTime: '11:00', endTime: '12:00', label: '11:00 AM - 12:00 PM' },
    { startTime: '12:00', endTime: '13:00', label: '12:00 PM - 01:00 PM' },
    { startTime: '13:00', endTime: '14:00', label: '01:00 PM - 02:00 PM' },
    { startTime: '14:00', endTime: '15:00', label: '02:00 PM - 03:00 PM' },
    { startTime: '15:00', endTime: '16:00', label: '03:00 PM - 04:00 PM' },
    { startTime: '16:00', endTime: '17:00', label: '04:00 PM - 05:00 PM' },
    { startTime: '17:00', endTime: '18:00', label: '05:00 PM - 06:00 PM' },
    { startTime: '18:00', endTime: '19:00', label: '06:00 PM - 07:00 PM' },
    { startTime: '19:00', endTime: '20:00', label: '07:00 PM - 08:00 PM' },
  ];

  console.log('Seeding time slots...');
  for (const slot of timeSlots) {
    const existing = await prisma.timeSlot.findFirst({ where: { label: slot.label } });
    if (!existing) {
      await prisma.timeSlot.create({ data: slot });
      console.log(`Created: ${slot.label}`);
    } else {
      console.log(`Exists: ${slot.label}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
