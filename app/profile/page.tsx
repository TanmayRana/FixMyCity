


'use client';

import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Shield,
  Calendar,
  Edit2,
  Save,
  X,
  ArrowLeft,
  Sun,
  Moon,
} from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/apiClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

// Helper Field Component
function ProfileField({
  icon,
  label,
  isEditing,
  value,
  displayValue,
  name,
  onChange,
  type = 'text',
  isTextarea = false,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  isEditing: boolean;
  value?: string;
  displayValue: string;
  name?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: string;
  isTextarea?: boolean;
  note?: string;
}) {
  return (
    <div className="flex items-start gap-5">
      <div className="w-14 h-14 rounded-lg bg-indigo-50 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">{label}</label>
        {isEditing ? (
          isTextarea ? (
            <Textarea
              name={name}
              value={value}
              onChange={onChange}
              rows={3}
              className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition dark:border-gray-600 dark:text-gray-100 dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
            />
          ) : (
            <Input
              name={name}
              value={value}
              onChange={onChange}
              type={type}
              className="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition dark:border-gray-600 dark:text-gray-100 dark:focus:ring-indigo-600 dark:focus:border-indigo-600"
            />
          )
        ) : (
          <p className="text-gray-900 dark:text-gray-100 text-lg">{displayValue}</p>
        )}
        {note && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{note}</p>}
      </div>
    </div>
  );
}

// Helper Account Info Component
function AccountInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-5">
      <div className="w-14 h-14 rounded-lg bg-indigo-50 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">{label}</label>
        <p className="text-gray-900 dark:text-gray-100 font-mono">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Dynamic user data
  const [userData, setUserData] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any | null>(null);
  const router = useRouter();

  // Load persisted theme on mount
  useEffect(() => {
    const storedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    }
  }, []);

  // Toggle theme and save preference
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
    }
  };

  const isLikelyObjectId = (val?: string | null) => !!val && /^[a-fA-F0-9]{24}$/.test(val);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/api/users/me');
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new ApiClientError(json?.error || 'Failed to load profile', res.status);
        }
        const u = json.data;
        const createdAt = u.createdAt ? new Date(u.createdAt) : new Date();
        const normalized = { ...u, createdAt };
        setUserData(normalized);
        setEditForm({
          name: normalized.name || '',
          phone: normalized.phone || '',
          address: normalized.address || '',
          department: normalized.department || '',
        });
      } catch (error) {
        if (error instanceof ApiClientError) {
          if (error.status === 404) {
            setApiUnavailable(true);
            const name = typeof window !== 'undefined' ? localStorage.getItem('userName') || 'User' : 'User';
            const role = typeof window !== 'undefined' ? localStorage.getItem('userRole') || 'citizen' : 'citizen';
            const department = typeof window !== 'undefined' ? localStorage.getItem('userDepartment') || '' : '';
            const email = typeof window !== 'undefined' ? localStorage.getItem('userEmail') || '' : '';
            const phone = typeof window !== 'undefined' ? localStorage.getItem('userPhone') || '' : '';
            const address = typeof window !== 'undefined' ? localStorage.getItem('userAddress') || '' : '';
            const fallback = {
              _id: 'local-profile',
              name,
              email,
              role,
              department,
              phone,
              address,
              isActive: true,
              createdAt: new Date(),
            } as any;
            setUserData(fallback);
            setEditForm({ name: fallback.name, phone: fallback.phone, address: fallback.address, department });
            toast.message('Running without API', { description: 'Using local settings for profile' });
          } else {
            toast.error(error.message);
          }
        } else {
          toast.error('Network error while loading profile');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleEdit = () => {
    if (!userData) return;
    setEditForm({
      name: userData.name || '',
      phone: userData.phone || '',
      address: userData.address || '',
      department: userData.department || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editForm) return;
    try {
      setSaving(true);
      if (apiUnavailable) {
        const updated = {
          ...(userData || {}),
          name: editForm.name,
          phone: editForm.phone || '',
          address: editForm.address || '',
          department: editForm.department || (userData?.department || ''),
        } as any;
        setUserData(updated);
        try {
          localStorage.setItem('userName', updated.name || 'User');
          if (updated.phone !== undefined) localStorage.setItem('userPhone', updated.phone);
          if (updated.address !== undefined) localStorage.setItem('userAddress', updated.address);
          if (updated.department !== undefined) localStorage.setItem('userDepartment', updated.department || '');
          if (userData?.email) localStorage.setItem('userEmail', userData.email);
        } catch {}
        toast.success('Profile saved locally');
      } else {
        const res = await apiClient.patch('/api/users/me', {
          name: editForm.name,
          phone: editForm.phone || undefined,
          address: editForm.address || undefined,
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new ApiClientError(json?.error || 'Failed to update profile', res.status);
        }
        const updated = json.data;
        const createdAt = updated.createdAt ? new Date(updated.createdAt) : (userData?.createdAt || new Date());
        setUserData({ ...updated, createdAt });
        try {
          if (updated?.name) localStorage.setItem('userName', updated.name);
          if (updated?.email) localStorage.setItem('userEmail', updated.email);
          if (updated?.phone !== undefined) localStorage.setItem('userPhone', updated.phone || '');
          if (updated?.address !== undefined) localStorage.setItem('userAddress', updated.address || '');
          if (updated?.department !== undefined) localStorage.setItem('userDepartment', updated.department || '');
        } catch {}
        toast.success('Profile updated');
      }
      setIsEditing(false);
    } catch (error) {
      if (error instanceof ApiClientError) toast.error(error.message);
      else toast.error('Network error while updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!userData) return setIsEditing(false);
    setEditForm({
      name: userData.name || '',
      phone: userData.phone || '',
      address: userData.address || '',
      department: userData.department || '',
    });
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setEditForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super-admin':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-10 text-gray-600 dark:text-gray-300 text-center">Loading profile…</div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-10 text-red-600 dark:text-red-400 text-center">Failed to load profile.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8 flex flex-col items-center transition-colors duration-500">
      <div className="flex justify-between w-full max-w-4xl mb-8 items-center">
        <Button
          className="border border-indigo-600 flex items-center gap-2 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition ease-in-out duration-300 dark:bg-indigo-600 dark:text-indigo-400 dark:hover:bg-indigo-500 dark:hover:text-white"
          onClick={() => router.back()}
        >
          <ArrowLeft />
          Back to Dashboard
        </Button>
        {/* <Button
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors dark:bg-indigo-700 dark:hover:bg-indigo-800"
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
        </Button> */}
      </div>
      <div className="max-w-4xl w-full">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden mb-8 ring-1 ring-indigo-100 dark:ring-indigo-700">
          <div className="bg-gradient-to-r from-indigo-400 to-blue-500 dark:from-indigo-700 dark:to-indigo-900 h-28 rounded-t-xl"></div>
          <div className="px-10 pb-10">
            <div className="flex items-end justify-between -mt-16 mb-8">
              <div className="flex items-end gap-5">
                <div className="w-32 h-32 rounded-full bg-white dark:bg-gray-800 shadow-xl flex items-center justify-center border-8 border-white dark:border-gray-900">
                  <User className="w-16 h-16 text-indigo-600 dark:text-indigo-400 drop-shadow-sm" />
                </div>
                <div className="mb-5">
                  <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 drop-shadow-sm">{userData.name}</h1>
                  <p className="text-gray-700 dark:text-gray-300 tracking-wide">{userData.email}</p>
                </div>
              </div>
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="mb-6 flex items-center gap-2 px-7 py-3 bg-indigo-600 text-white rounded-xl shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-600 transition ease-in-out duration-300"
                >
                  <Edit2 className="w-5 h-5" />
                  Edit Profile
                </button>
              ) : (
                <div className="mb-6 flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-7 py-3 bg-green-600 text-white rounded-xl shadow-md hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition ease-in-out duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-7 py-3 bg-gray-400 text-white rounded-xl shadow-md hover:bg-gray-500 focus:outline-none focus:ring-4 focus:ring-gray-300 transition ease-in-out duration-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            {/* Status Badges */}
            <div className="flex gap-4">
              <span
                className={`px-5 py-2 rounded-full text-sm font-semibold ${getRoleBadgeColor(
                  userData.role,
                )} drop-shadow-sm`}
              >
                {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
              </span>
              <span
                className={`px-5 py-2 rounded-full text-sm font-semibold ${
                  userData.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                } drop-shadow-sm`}
              >
                {userData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        {/* Profile Details Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-10 ring-1 ring-indigo-50 dark:ring-indigo-700 transition-colors duration-300">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-8 tracking-wide">Profile Information</h2>
          <div className="space-y-8">
            <ProfileField
              icon={<User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
              label="Full Name"
              isEditing={isEditing}
              value={editForm?.name || ''}
              displayValue={userData.name}
              name="name"
              onChange={handleInputChange}
              type="text"
            />
            <ProfileField
              icon={<Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
              label="Email Address"
              isEditing={false}
              displayValue={userData.email}
              note="Email cannot be changed"
            />
            <ProfileField
              icon={<Phone className="w-6 h-6 text-green-600 dark:text-green-400" />}
              label="Phone Number"
              isEditing={isEditing}
              value={editForm?.phone || ''}
              displayValue={userData.phone || 'Not provided'}
              name="phone"
              onChange={handleInputChange}
              type="tel"
            />
            {
              editForm?.department && (
                <ProfileField
                  icon={<Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
                  label="Department"
                  isEditing={false}
              value={editForm?.department || ''}
              displayValue={!isLikelyObjectId(userData.department) ? (userData.department || 'Not assigned') : 'Not assigned'}
              name="department"
              onChange={handleInputChange}
              type="text"
                 note="Department cannot be changed"
            />
              )
            }
            
            {/* Account Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-indigo-100 dark:border-indigo-700">
              <AccountInfo icon={<Shield className="w-6 h-6 text-red-600 dark:text-red-400" />} label="User ID" value={userData._id} />
              <AccountInfo
                icon={<Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />}
                label="Member Since"
                value={userData.createdAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
