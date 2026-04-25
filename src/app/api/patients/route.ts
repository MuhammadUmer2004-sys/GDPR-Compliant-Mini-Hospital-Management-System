import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hashName, maskContact } from '@/lib/crypto';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const patients = await prisma.patient.findMany({
    orderBy: { dateAdded: 'desc' },
  });

  // Role-based filtering
  const filteredPatients = patients.map((p) => {
    if (session.role === 'admin') return p;
    if (session.role === 'doctor') {
      return {
        id: p.id,
        anonymizedName: p.anonymizedName || hashName(p.name),
        anonymizedContact: p.anonymizedContact || maskContact(p.contact),
        diagnosis: p.diagnosis,
        dateAdded: p.dateAdded,
      };
    }
    // Receptionist: Can see names/contacts to manage records, but NO diagnosis
    if (session.role === 'receptionist') {
      return {
        id: p.id,
        name: p.name,
        contact: p.contact,
        diagnosis: 'HIDDEN (Sensitive)',
        dateAdded: p.dateAdded,
      };
    }
    return { id: p.id, dateAdded: p.dateAdded };
  });

  return NextResponse.json(filteredPatients);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !['admin', 'receptionist'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, contact, diagnosis } = await request.json();

  const patient = await prisma.patient.create({
    data: {
      name,
      contact,
      diagnosis,
      anonymizedName: hashName(name),
      anonymizedContact: maskContact(contact),
    },
  });

  await prisma.log.create({
    data: {
      userId: session.id,
      role: session.role,
      action: 'add_patient',
      details: `name=${name}`,
    },
  });

  return NextResponse.json(patient);
}
