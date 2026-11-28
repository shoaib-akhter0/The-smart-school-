import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';
import { GUEST_USER } from '../data/initialData';

interface AuthContextType {
  currentUser: User;
  switchRole: (role: UserRole) => Promise<void>;
  loginWithCredentials: (usernameOrEmail: string, password?: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateAvatar: (fileOrBase64: File | string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  mustChangePassword: boolean;
  setMustChangePassword: (val: boolean) => void;
  isLoading: boolean;
  availableUsers: User[];
  refreshUsers: () => Promise<void>;
  canEditOriginals: boolean;
  canSubmitRevisions: boolean;
  canFlagForReview: boolean;
  canManageUsers: boolean;
  canBulkImport: boolean;
  isGM: boolean;
  isAccountant: boolean;
  isHOD: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('smart_school_token'));
  });
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);

  // The backend only lets the GM list accounts (used by User Management).
  const fetchUsers = async () => {
    try {
      const data = await api.auth.getUsers();
      if (Array.isArray(data) && data.length > 0) {
        setAvailableUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch available users:', err);
    }
  };

  useEffect(() => {
    // Validate stored token & session
    const token = localStorage.getItem('smart_school_token');
    if (token) {
      api.auth.getCurrentUser()
        .then(async user => {
          if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
            if (user.needsPasswordChange) {
              setMustChangePassword(true);
            }
            if (user.role === 'GM') await fetchUsers();
          }
        })
        .catch(() => {
          // invalid token
          localStorage.removeItem('smart_school_token');
          localStorage.removeItem('smart_school_role');
          setIsAuthenticated(false);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const switchRole = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const data = await api.auth.switchRole(targetRole);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithCredentials = async (usernameOrEmail: string, password?: string) => {
    setIsLoading(true);
    try {
      const data = await api.auth.login({ email: usernameOrEmail, password });
      if (data.user) {
        if (data.user.role === 'GM') await fetchUsers();
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        if (data.user.needsPasswordChange) {
          setMustChangePassword(true);
        } else {
          setMustChangePassword(false);
        }
      }
    } catch (err) {
      console.error('Failed to login:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const data = await api.auth.changePassword(currentPassword, newPassword);
      if (data.user) {
        setCurrentUser(data.user);
      }
      setMustChangePassword(false);
    } catch (err) {
      console.error('Failed to change password:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      const res = await api.auth.updateProfile(data);
      if (res.user) {
        setCurrentUser(res.user);
        setAvailableUsers(prev => prev.map(u => u.id === res.user.id ? res.user : u));
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvatar = async (fileOrBase64: File | string) => {
    try {
      const res = await api.auth.uploadAvatar(fileOrBase64);
      if (res.user) {
        setCurrentUser(res.user);
        setAvailableUsers(prev => prev.map(u => u.id === res.user.id ? res.user : u));
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      throw err;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.auth.logout();
    } catch (err) {
      console.warn('Logout error ignored:', err);
    } finally {
      localStorage.removeItem('smart_school_token');
      localStorage.removeItem('smart_school_role');
      setIsAuthenticated(false);
      setMustChangePassword(false);
      setIsLoading(false);
    }
  };

  // Role capability booleans
  const isGM = currentUser.role === 'GM';
  const isAccountant = currentUser.role === 'ACCOUNTANT';
  const isHOD = currentUser.role === 'HOD';

  // Critical permission rule: GM CANNOT edit original records! Only Accountant can edit originals.
  const canEditOriginals = isAccountant;
  const canSubmitRevisions = isHOD || isAccountant;
  const canFlagForReview = isGM || isHOD;
  const canManageUsers = isGM;
  const canBulkImport = isAccountant;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        switchRole,
        loginWithCredentials,
        changePassword,
        updateProfile,
        updateAvatar,
        logout,
        isAuthenticated,
        setIsAuthenticated,
        mustChangePassword,
        setMustChangePassword,
        isLoading,
        availableUsers,
        refreshUsers: fetchUsers,
        canEditOriginals,
        canSubmitRevisions,
        canFlagForReview,
        canManageUsers,
        canBulkImport,
        isGM,
        isAccountant,
        isHOD,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
