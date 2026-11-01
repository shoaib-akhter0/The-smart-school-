import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, Lock, Eye, FileCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SecurityBannerProps {
  moduleContext?: 'dashboard' | 'students' | 'vendors' | 'payments' | 'audit' | 'general';
}

export const SecurityBanner: React.FC<SecurityBannerProps> = () => {
  return null;
};
