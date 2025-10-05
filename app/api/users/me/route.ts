import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import Department from '@/lib/models/Department';
import jwt from 'jsonwebtoken';

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authUser = verifyToken(request);
  
    
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await User.findById(authUser.userId).select('-password');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Map department id to name if possible
    let deptValue: any = (user as any).department;
    if (typeof deptValue === 'string' && /^[a-fA-F0-9]{24}$/.test(deptValue)) {
      const deptDoc = (await Department.findById(deptValue)
        .select('name')
        .lean()) as { name?: string } | null;
      if (deptDoc && deptDoc.name) {
        (user as any).department = deptDoc.name;
      }
    }

    return NextResponse.json({ success: true, data: user });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const authUser = verifyToken(request);
    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, phone, address } = await request.json();
    const update: any = {};
    if (typeof name === 'string') update.name = name;
    if (typeof phone === 'string' || phone === null) update.phone = phone || undefined;
    if (typeof address === 'string' || address === null) update.address = address || undefined;

    const updated = await User.findByIdAndUpdate(authUser.userId, { $set: update }, { new: true }).select('-password');
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Map department id to name if possible in response
    let deptValue: any = (updated as any).department;
    if (typeof deptValue === 'string' && /^[a-fA-F0-9]{24}$/.test(deptValue)) {
      const deptDoc = (await Department.findById(deptValue)
        .select('name')
        .lean()) as { name?: string } | null;
      if (deptDoc && deptDoc.name) {
        (updated as any).department = deptDoc.name;
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
