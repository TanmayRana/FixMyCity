/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/navbar";
import { ArrowLeft, Upload, MapPin, Camera, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { complaintSchema, type ComplaintFormData } from "@/lib/validations/complaint";
import { apiClient, ApiClientError } from "@/lib/apiClient";

export default function SubmitComplaint() {
  const [photos, setPhotos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [userName, setUserName] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
    reset,
  } = useForm<ComplaintFormData>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      title: "",
      category: undefined as any,
      priority: undefined as any,
      description: "",
      location: "",
      images: [],
    },
  });

  React.useEffect(() => {
    const storedUserName = localStorage.getItem("userName");
    if (storedUserName) {
      setUserName(storedUserName);
    }
    (async () => {
      try {
        const res = await fetch("/api/public/categories", {
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          console.log(json);
          setCategories(json.data || []);
        }
      } catch {}
    })();
  }, []);

  const priorities = [
    { value: "low", label: "Low - Minor issue, can wait" },
    { value: "medium", label: "Medium - Moderate concern" },
    { value: "high", label: "High - Urgent attention needed" },
    { value: "critical", label: "Critical - Safety hazard" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setValue(e.target.name as keyof ComplaintFormData, e.target.value as any, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 5); // Limit to 5 files
      setPhotos(files);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setValue(
            "location",
            `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
            { shouldValidate: true, shouldDirty: true }
          );
          toast.success("Location captured successfully");
        },
        (error) => {
          toast.error("Unable to get location. Please enter manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
    }
  };

  const onSubmit = async (data: ComplaintFormData) => {
    setIsLoading(true);
    try {
      // Upload images first
      const uploadedImages: string[] = [];
      for (const file of photos) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", "complaints");

        // const uploadResponse = await apiClient.post("/api/upload", fd as any, {
        //   method: "POST",
        //   body: fd as any,
        //   // Let the browser set Content-Type for multipart
        //   headers: {},
        // });
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: fd,
        });
        const uploadResult = await uploadResponse.json();
        if (uploadResponse.ok && uploadResult.url) {
          uploadedImages.push(uploadResult.url);
        }
      }

      const payload: ComplaintFormData = {
        ...data,
        images: uploadedImages,
      };

      const res = await apiClient.post("/api/complaints", payload);
      if (res.ok) {
        toast.success("Complaint submitted successfully!");
        reset();
        setPhotos([]);
        router.push("/dashboard/citizen");
      } else {
        const err = await res.json().catch(() => ({ error: "Failed to submit" }));
        toast.error(err.error || "Failed to submit complaint");
      }
    } catch (error) {
      if (error instanceof ApiClientError) {
        toast.error(error.message || "Failed to submit complaint");
      } else {
        toast.error("An error occurred while submitting the complaint");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar userName={userName} userRole="citizen" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/dashboard/citizen">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Submit New Complaint
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Report a civic issue in your community. Be as detailed as possible
            to help us resolve it quickly.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Complaint Details</CardTitle>
                <CardDescription>
                  Provide detailed information about the issue you're reporting
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Complaint Title *</Label>
                    <Input
                      id="title"
                      // name="title"
                      placeholder="Brief description of the issue"
                      {...register("title")}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.title && (
                      <p className="text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue(
                            "category",
                            value as ComplaintFormData["category"],
                            { shouldValidate: true }
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select complaint category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-red-600">{errors.category.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority Level *</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue("priority", value as any, { shouldValidate: true })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority level" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map((priority) => (
                            <SelectItem
                              key={priority.value}
                              value={priority.value}
                            >
                              {priority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.priority && (
                        <p className="text-sm text-red-600">{errors.priority.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="location"
                        // name="location"
                        placeholder="Enter address or location details"
                        {...register("location", { required: true })}
                        onChange={handleInputChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={getCurrentLocation}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                    {errors.location && (
                      <p className="text-sm text-red-600">{errors.location.message}</p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click the location button to auto-fill with your current location
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      // name="description"
                      placeholder="Provide a detailed description of the issue, including when you first noticed it, how it affects the community, and any other relevant information..."
                      rows={6}
                      {...register("description")}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photos">Upload Photos (Optional)</Label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="photos"
                        name="photos"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="photos" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                          Click to upload photos or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PNG, JPG up to 10MB each (max 5 files)
                        </p>
                      </label>
                      {photos.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            Selected files: {photos.length}
                          </p>
                          <ul className="text-sm text-gray-600 dark:text-gray-300">
                            {photos.map((file, index) => (
                              <li key={index}>{file.name}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Submitting..." : "Submit Complaint"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="mr-2 h-5 w-5" />
                  Photo Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-gray-600 dark:text-gray-300">
                  <li>• Take clear, well-lit photos</li>
                  <li>• Include multiple angles if helpful</li>
                  <li>• Show the location context</li>
                  <li>• Capture any safety hazards</li>
                  <li>• Max 5 photos, 10MB each</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Priority Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-red-600">Critical:</span>
                    <p className="text-gray-600 dark:text-gray-300">
                      Immediate safety hazard
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-orange-600">High:</span>
                    <p className="text-gray-600 dark:text-gray-300">
                      Urgent attention needed
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">Medium:</span>
                    <p className="text-gray-600 dark:text-gray-300">
                      Moderate concern
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Low:</span>
                    <p className="text-gray-600 dark:text-gray-300">
                      Minor issue, can wait
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div className="flex items-start space-x-2">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                      1
                    </span>
                    <p>
                      Your complaint is automatically routed to the appropriate
                      department
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                      2
                    </span>
                    <p>Department admin reviews and assigns the complaint</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                      3
                    </span>
                    <p>You receive updates as progress is made</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                      4
                    </span>
                    <p>Final confirmation when the issue is resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
