import { z } from "zod";

export const complaintSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters")
    .trim(),
  
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(1000, "Description must be less than 1000 characters")
    .trim(),
  
  category: z.enum([
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
  ], { errorMap: () => ({ message: 'Please select a valid department' }) }),
  
  priority: z
    .enum(["low", "medium", "high", "critical"], {
      errorMap: () => ({ message: "Please select a priority level" }),
    }),
  
  location: z
    .string()
    .min(5, "Location must be at least 5 characters")
    .max(200, "Location must be less than 200 characters")
    .trim(),
  
  coordinates: z
    .object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    })
    .optional(),
  
  images: z
    .array(z.string().url("Invalid image URL"))
    .max(5, "Maximum 5 images allowed")
    .optional()
    .default([]),
});

export const complaintUpdateSchema = z.object({
  status: z
    .enum(["submitted", "in-progress", "resolved", "closed"])
    .optional(),
  
  assignedTo: z
    .string()
    .optional(),
  
  department: z
    .string()
    .optional(),
  
  resolution: z
    .string()
    .max(500, "Resolution must be less than 500 characters")
    .optional(),
  
  resolutionDate: z
    .date()
    .optional(),
  
  remark: z
    .string()
    .min(1, "Remark cannot be empty")
    .max(500, "Remark must be less than 500 characters")
    .optional(),
});

export type ComplaintFormData = z.infer<typeof complaintSchema>;
export type ComplaintUpdateData = z.infer<typeof complaintUpdateSchema>;
