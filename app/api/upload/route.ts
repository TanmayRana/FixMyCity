// import { NextRequest, NextResponse } from 'next/server';
// import { uploadImage } from '@/lib/imagekit';
// import jwt from 'jsonwebtoken';

// // Middleware to verify JWT token
// const verifyToken = (request: NextRequest) => {
//   const authHeader = request.headers.get('authorization');
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return null;
//   }
  
//   const token = authHeader.substring(7);
//   try {
//     return jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
//   } catch (error) {
//     return null;
//   }
// };

// export async function POST(request: NextRequest) {
//   try {
//     const user = verifyToken(request);
//     console.log(user);
//     if (!user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const formData = await request.formData();
//     const file = formData.get('file') as File;
//     const folder = formData.get('folder') as string || 'complaints';

//     if (!file) {
//       return NextResponse.json(
//         { error: 'No file provided' },
//         { status: 400 }
//       );
//     }

//     // Validate file type
//     if (!file.type.startsWith('image/')) {
//       return NextResponse.json(
//         { error: 'Only image files are allowed' },
//         { status: 400 }
//       );
//     }

//     // Validate file size (10MB limit)
//     if (file.size > 10 * 1024 * 1024) {
//       return NextResponse.json(
//         { error: 'File size must be less than 10MB' },
//         { status: 400 }
//       );
//     }

//     // Convert file to buffer
//     const buffer = Buffer.from(await file.arrayBuffer());
    
//     // Upload to ImageKit
//     const result = await uploadImage(buffer, file.name, folder);

//     if (!result.success) {
//       return NextResponse.json(
//         { error: result.error || 'Upload failed' },
//         { status: 500 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       url: result.url,
//       fileId: result.fileId,
//     });

//   } catch (error) {
//     console.error('Upload error:', error);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }



import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/imagekit';
import { verifyTokenFromRequest } from '@/lib/auth';

// Ensure Node.js runtime (Buffer required) and avoid static optimization
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = verifyTokenFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'complaints';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Validate ImageKit environment configuration early
    if (!process.env.IMAGEKIT_PUBLIC_KEY || !process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_URL_ENDPOINT) {
      return NextResponse.json(
        { error: 'Image storage is not configured. Missing IMAGEKIT_* environment variables.' },
        { status: 500 }
      );
    }

    // Convert file to buffer (Node runtime required)
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Upload to ImageKit
    const result = await uploadImage(buffer, file.name, folder);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      fileId: result.fileId,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
