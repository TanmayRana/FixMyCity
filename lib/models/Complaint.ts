import mongoose, { Document, Schema } from 'mongoose';

export interface IComplaint extends Document {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'submitted' | 'in-progress' | 'resolved' | 'closed';
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  images: string[];
  remarks?: string[];
  submittedBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  department?: string;
  resolution?: string;
  resolutionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
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
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
  },
  status: {
    type: String,
    enum: ['submitted', 'in-progress', 'resolved', 'closed'],
    default: 'submitted',
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180,
    },
  },
  images: [{
    type: String,
  }],
  remarks: {
    type: [String],
    default: [],
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  department: {
    type: String,
    required: function() {
      return this.status !== 'submitted';
    },
  },
  resolution: {
    type: String,
    trim: true,
  },
  resolutionDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Index for better query performance
ComplaintSchema.index({ status: 1, priority: 1 });
ComplaintSchema.index({ submittedBy: 1 });
ComplaintSchema.index({ assignedTo: 1 });
ComplaintSchema.index({ category: 1 });
ComplaintSchema.index({ createdAt: -1 });

export default mongoose.models.Complaint || mongoose.model<IComplaint>('Complaint', ComplaintSchema);
