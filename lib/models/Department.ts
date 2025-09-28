import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  _id: string;
  name: string;
  description: string;
  head: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  categories: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  head: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  categories: [{
    type: String,
    enum: [
      'Public Works',
      'Water & Sewage',
      'Transportation',
      'Parks & Recreation',
      'Building & Safety',
      'Environmental Services',
      'Public Health',
      'Street Lighting',
      'Waste Management',
      'Traffic Management'
    ],
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Department || mongoose.model<IDepartment>('Department', DepartmentSchema);
