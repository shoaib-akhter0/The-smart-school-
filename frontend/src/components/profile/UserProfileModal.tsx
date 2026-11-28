import React, { useState, useRef, useEffect } from 'react';
import {
  X, Camera, Upload, Trash2, KeyRound, Shield, Check,
  Building, LogOut, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'profile' | 'security';
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'profile',
}) => {
  const {
    currentUser,
    updateAvatar,
    updateProfile,
    changePassword,
    logout,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>(initialTab);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  
  // Profile picture upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  // Profile details editing state
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [department, setDepartment] = useState(currentUser.department || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // This modal stays mounted (from before login), so refill the form with the saved values each time it opens.
  useEffect(() => {
    if (isOpen) {
      setName(currentUser.name);
      setPhone(currentUser.phone || '');
      setDepartment(currentUser.department || '');
    }
  }, [isOpen, currentUser]);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  if (!isOpen) return null;

  const roleColors: Record<UserRole | '', { badge: string; border: string; bg: string }> = {
    GM: {
      badge: 'bg-red-50 text-red-700 border-red-200',
      border: 'border-red-200',
      bg: 'bg-red-50',
    },
    ACCOUNTANT: {
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
    },
    HOD: {
      badge: 'bg-blue-50 text-blue-800 border-blue-200',
      border: 'border-blue-200',
      bg: 'bg-blue-50',
    },
    '': { badge: 'bg-slate-50 text-slate-600 border-slate-200', border: 'border-slate-200', bg: 'bg-slate-50' },
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be less than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAvatar = async () => {
    if (!avatarPreview) return;
    setIsUploadingAvatar(true);
    setAvatarSuccess(false);
    try {
      await updateAvatar(avatarPreview);
      setAvatarSuccess(true);
      setTimeout(() => setAvatarSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save profile picture.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsUploadingAvatar(true);
    try {
      await updateAvatar('');
      setAvatarPreview(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccess(false);
    try {
      await updateProfile({ name, phone, department });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile information.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(false);

    if (!currentPassword) {
      setPassError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 6) {
      setPassError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match.');
      return;
    }

    setIsChangingPass(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPassSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPassSuccess(false), 3500);
    } catch (err: any) {
      setPassError(err?.response?.data?.error || err.message || 'Failed to change password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  const currentDisplayAvatar = avatarPreview || currentUser.avatar;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        
        {/* Header with smart branding */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-linear-to-r from-slate-50 via-white to-red-50/30 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C62828] text-white shadow-md shadow-red-900/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                User Profile &amp; Account Settings
              </h2>
              <p className="text-xs text-slate-500">
                Manage profile avatar, credentials, and institutional role access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'profile'
                ? 'border-[#C62828] text-[#C62828]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Profile &amp; Picture</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
              activeTab === 'security'
                ? 'border-[#C62828] text-[#C62828]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>Credential Management</span>
          </button>
        </div>

        {/* Tab content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: PROFILE PICTURE & DETAILS */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Avatar Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Avatar circle with image or initials */}
                  <div className="relative group shrink-0">
                    {currentDisplayAvatar ? (
                      <img
                        src={currentDisplayAvatar}
                        alt={currentUser.name}
                        className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#C62828] text-2xl font-bold text-white shadow-lg ring-2 ring-red-200">
                        {currentUser.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 rounded-full bg-slate-900 p-2 text-white shadow-md hover:bg-[#C62828] transition"
                      title="Upload custom profile picture"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Upload controls and instructions */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Custom Profile Picture
                      </h3>
                      <p className="text-xs text-slate-500">
                        Upload your personal photo (PNG, JPG, WEBP, max 5MB). Rendered dynamically across the top navigation bar and audit trail.
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                      >
                        <Upload className="h-3.5 w-3.5 text-slate-500" />
                        <span>Select Photo</span>
                      </button>

                      {avatarPreview && avatarPreview !== currentUser.avatar && (
                        <button
                          type="button"
                          onClick={handleSaveAvatar}
                          disabled={isUploadingAvatar}
                          className="flex items-center gap-1.5 rounded-lg bg-[#C62828] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-800 shadow-xs transition disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>{isUploadingAvatar ? 'Saving...' : 'Apply & Save Photo'}</span>
                        </button>
                      )}

                      {currentUser.avatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={isUploadingAvatar}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    {avatarSuccess && (
                      <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Profile picture updated successfully!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Information Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#C62828] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Institutional Email (Fixed)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={currentUser.email}
                        disabled
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+92 300 0000000"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#C62828] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Department / Office
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Finance, Oversight, Admin..."
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-900 focus:border-[#C62828] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Clearance Details Card */}
                <div className={`rounded-xl border p-3.5 ${roleColors[currentUser.role].bg} ${roleColors[currentUser.role].border}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      System Role &amp; Access Clearance
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${roleColors[currentUser.role].badge}`}>
                      {currentUser.role === 'GM' ? 'Super Admin / GM' : currentUser.role === 'ACCOUNTANT' ? 'Senior Accountant' : 'Head of Department'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    {currentUser.role === 'GM' && 'Highest administrative clearance. Oversees user accounts and system configuration with anti-tampering financial rules.'}
                    {currentUser.role === 'ACCOUNTANT' && 'Primary financial ledger authority. Manages student fee invoices, vendor payables, and payment receipts.'}
                    {currentUser.role === 'HOD' && 'Departmental academic oversight. Inspects ledgers, verifies balances, and submits authorized revisions.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  {profileSuccess && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Check className="h-4 w-4" /> Profile details saved!
                    </span>
                  )}
                  <div className="ml-auto">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="flex items-center gap-2 rounded-lg bg-[#C62828] px-4 py-2 text-xs font-bold text-white hover:bg-red-800 shadow-xs transition disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Details'}</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: CREDENTIAL MANAGEMENT */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-[#C62828]">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Update Portal Password
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Choose a secure password of at least 6 characters to protect your institutional access.
                    </p>
                  </div>
                </div>
              </div>

              {passError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-[#C62828]" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Password updated successfully! Next login requires your new password.</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-9 text-xs text-slate-900 focus:border-[#C62828] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="At least 6 characters"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-9 text-xs text-slate-900 focus:border-[#C62828] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter new password"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#C62828] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPass}
                    className="flex items-center gap-2 rounded-lg bg-[#C62828] px-4 py-2 text-xs font-bold text-white hover:bg-red-800 shadow-xs transition disabled:opacity-50"
                  >
                    <KeyRound className="h-4 w-4" />
                    <span>{isChangingPass ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>

              {/* Secure Sign Out Section */}
              <div className="mt-8 rounded-xl border border-red-200 bg-red-50/50 p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-red-900">
                    Exit Portal Session
                  </h4>
                  <p className="text-[11px] text-red-700">
                    Safely log out of the Smart School Management System.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    logout();
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <Building className="h-3.5 w-3.5 text-[#C62828]" />
            <span>The Smart School Management System • Enterprise Portal</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
