import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Complaint from '@/lib/models/Complaint';
import User from '@/lib/models/User';
import { verifyTokenFromRequest } from '@/lib/auth';
// Unified token verification is provided by verifyTokenFromRequest

// GET /api/complaints/[id] - Get single complaint
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = verifyTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const complaint = await Complaint.findById(params.id)
      .populate('submittedBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this complaint
    if (user.role === 'citizen' && complaint.submittedBy._id.toString() !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (user.role === 'admin' && complaint.assignedTo?._id.toString() !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: complaint,
    });

  } catch (error) {
    console.error('Get complaint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/complaints/[id] - Update complaint
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = verifyTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const complaint = await Complaint.findById(params.id);

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'citizen' && complaint.submittedBy.toString() !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (user.role === 'admin' && complaint.assignedTo?.toString() !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData = await request.json();
    
    // Citizens can only update certain fields
    if (user.role === 'citizen') {
      const allowedFields = ['title', 'description', 'location', 'coordinates', 'images'];
      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {} as any);
      
      Object.assign(complaint, filteredData);
    } else {
      // Admins and super admins can update all fields
      Object.assign(complaint, updateData);
    }

    await complaint.save();
    await complaint.populate('submittedBy', 'name email');
    await complaint.populate('assignedTo', 'name email');

    return NextResponse.json({
      success: true,
      data: complaint,
    });

  } catch (error) {
    console.error('Update complaint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/complaints/[id] - Delete complaint
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const user = verifyTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can delete complaints
    if (user.role !== 'super-admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const complaint = await Complaint.findByIdAndDelete(params.id);

    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Complaint deleted successfully',
    });

  } catch (error) {
    console.error('Delete complaint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
