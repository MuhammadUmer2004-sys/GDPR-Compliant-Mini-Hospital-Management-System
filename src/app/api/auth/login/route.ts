import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { login } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      // @ts-ignore - Build ID: V2_MONGO_FIX
      await login({ id: user.id as any, username: user.username, role: user.role });
      
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
    if (user) {
      await prisma.log.create({
        data: {
          userId: user.id,
          role: user.role,
          action: 'failed_login',
          details: `Invalid password for ${username}`,
        }
      });
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error: any) {
    console.error('Login error:', error);
    // Return a more descriptive error if it's likely a database connection issue
    if (error.message?.includes('database') || error.code?.startsWith('P')) {
      return NextResponse.json({ error: 'Database connection error. Ensure you set a real DATABASE_URL (Postgres/MySQL) on Vercel.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal system error' }, { status: 500 });
  }
}
