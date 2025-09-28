# FixMyCity - Civic Grievance Redressal Platform

A comprehensive civic engagement platform designed to bridge the gap between citizens and government departments. This platform enables efficient complaint management and resolution tracking for better community services.

## Features

### For Citizens
- Submit complaints with photos and location details
- Track complaint status in real-time
- Receive updates and notifications
- View resolution history

### For Department Administrators
- Receive assigned complaints
- Update complaint status
- Coordinate resolution efforts
- Communicate with citizens

### For Super Administrators
- Monitor system performance
- Manage departments and users
- Generate reports and analytics
- Oversee complaint routing

## Tech Stack

- **Frontend**: Next.js 13, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Image Storage**: ImageKit
- **Authentication**: JWT tokens
- **UI Components**: Radix UI, Lucide React

## Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud)
- ImageKit account

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/fixmycity
   # For production: mongodb+srv://username:password@cluster.mongodb.net/fixmycity

   # ImageKit Configuration
   IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
   IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_imagekit_id

   # JWT Secret for authentication
   JWT_SECRET=your_jwt_secret_key_here

   # Next.js Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret_here
   ```

4. **Set up MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update the `MONGODB_URI` in your `.env.local` file

5. **Set up ImageKit**
   - Create an account at [ImageKit](https://imagekit.io/)
   - Get your public key, private key, and URL endpoint
   - Update the ImageKit configuration in your `.env.local` file

6. **Run the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Complaints
- `GET /api/complaints` - Get all complaints (with filters)
- `POST /api/complaints` - Create new complaint
- `GET /api/complaints/[id]` - Get single complaint
- `PUT /api/complaints/[id]` - Update complaint
- `DELETE /api/complaints/[id]` - Delete complaint (super admin only)

### Users
- `GET /api/users` - Get all users (super admin only)
- `POST /api/users` - Create new user (super admin only)

### Departments
- `GET /api/departments` - Get all departments (super admin only)
- `POST /api/departments` - Create new department (super admin only)

### Upload
- `POST /api/upload` - Upload images to ImageKit

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Database Schema

### User Model
```typescript
{
  name: string;
  email: string;
  password: string;
  role: 'citizen' | 'admin' | 'super-admin';
  department?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}
```

### Complaint Model
```typescript
{
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'submitted' | 'in-progress' | 'resolved' | 'closed';
  location: string;
  coordinates?: { latitude: number; longitude: number };
  images: string[];
  submittedBy: ObjectId;
  assignedTo?: ObjectId;
  department?: string;
  resolution?: string;
  resolutionDate?: Date;
}
```

### Department Model
```typescript
{
  name: string;
  description: string;
  head: ObjectId;
  members: ObjectId[];
  categories: string[];
  isActive: boolean;
}
```

## User Roles

### Citizen
- Can submit complaints
- Can view their own complaints
- Can track complaint status
- Cannot access admin features

### Admin
- Can view assigned complaints
- Can update complaint status
- Can add resolution notes
- Cannot create users or departments

### Super Admin
- Full system access
- Can create users and departments
- Can view all complaints
- Can manage system settings

## Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set up production environment variables**
   - Update MongoDB URI for production
   - Configure ImageKit for production
   - Set secure JWT secrets

3. **Deploy to your preferred platform**
   - Vercel (recommended for Next.js)
   - Netlify
   - AWS
   - DigitalOcean

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
