import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { hashName, encrypt, maskContact } from '@/lib/crypto';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || !['admin', 'receptionist'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, contact, diagnosis } = await request.json();
  const id = parseInt((await params).id);

  const patient = await prisma.patient.update({
    where: { id },
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
      action: 'update_patient',
      details: `Updated patient ID ${id}`,
    },
  });

  return NextResponse.json(patient);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = parseInt((await params).id);

  await prisma.patient.delete({
    where: { id },
  });

  await prisma.log.create({
    data: {
      userId: session.id,
      role: session.role,
      action: 'delete_patient',
      details: `Deleted patient ID ${id}`,
    },
  });

  return NextResponse.json({ success: true });
}
