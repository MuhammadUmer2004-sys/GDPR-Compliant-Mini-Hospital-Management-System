import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hashName, encrypt, maskContact } from '@/lib/crypto';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action } = await request.json();

  if (action === 'anonymize_all') {
    const patients = await prisma.patient.findMany();
    
    for (const p of patients) {
      await prisma.patient.update({
        where: { id: p.id },
        data: {
          anonymizedName: hashName(p.name),
          anonymizedContact: encrypt(p.contact), // Reversible encryption for bonus
        }
      });
    }

    await prisma.log.create({
      data: {
        userId: session.id,
        role: session.role,
        action: 'anonymize_all',
        details: `Processed ${patients.length} records`,
      }
    });

    return NextResponse.json({ success: true, count: patients.length });
  }

  if (action === 'cleanup') {
    // GDPR Cleanup: Delete logs older than 1 year, patients older than 3 years
    const logCutoff = new Date();
    logCutoff.setFullYear(logCutoff.getFullYear() - 1);
    
    const patientCutoff = new Date();
    patientCutoff.setFullYear(patientCutoff.getFullYear() - 3);

    const deletedLogs = await prisma.log.deleteMany({
      where: { timestamp: { lt: logCutoff } }
    });

    const deletedPatients = await prisma.patient.deleteMany({
      where: { dateAdded: { lt: patientCutoff } }
    });

    await prisma.log.create({
      data: {
        userId: session.id,
        role: session.role,
        action: 'gdpr_cleanup',
        details: `Deleted ${deletedLogs.count} logs and ${deletedPatients.count} patients`,
      }
    });

    return NextResponse.json({ success: true, deletedLogs: deletedLogs.count, deletedPatients: deletedPatients.count });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
