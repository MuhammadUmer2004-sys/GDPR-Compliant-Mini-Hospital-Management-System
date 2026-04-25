import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { login } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (user && (await bcrypt.compare(password, user.password))) {
    await login({ id: user.id, username: user.username, role: user.role });
    
    // Log the action
    await prisma.log.create({
      data: {
        userId: user.id,
        role: user.role,
        action: 'login',
        details: `${username} logged in`,
      }
    });

    return NextResponse.json({ success: true, role: user.role });
  }

  // Log failed attempt
  await prisma.log.create({
    data: {
      role: 'unknown',
      action: 'failed_login',
      details: `username=${username}`,
    }
  });

  return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
}
