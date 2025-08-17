import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, UserProfile } from '@/config/api';

interface User {
  uid: string;
  email: string;
  displayName: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  googleSignIn: (idToken: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on app start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('legalai_user');
        const storedToken = localStorage.getItem('legalai_token');
        
        if (storedUser && storedToken) {
          const userData = JSON.parse(storedUser);
          
          // Set token in API client
          apiClient.setAuthToken(storedToken);
          
          // Verify token is still valid by fetching user profile
          try {
            const profile = await apiClient.getUserProfile();
            setUser({
              uid: profile.uid,
              email: profile.email,
              displayName: profile.display_name,
              token: storedToken
            });
          } catch (error) {
            // Token is invalid, clear all storage and redirect to login
            localStorage.clear();
            sessionStorage.clear();
            apiClient.clearAuthToken();
            setUser(null);
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login(email, password);
      
      const userData: User = {
        uid: response.uid,
        email: response.email,
        displayName: response.email.split('@')[0], // Use email prefix as display name
        token: response.id_token
      };

      // Store in localStorage
      localStorage.setItem('legalai_user', JSON.stringify({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName
      }));
      localStorage.setItem('legalai_token', userData.token);

      // Set token in API client
      apiClient.setAuthToken(userData.token);
      
      setUser(userData);
    } catch (error) {
      throw new Error(`Login failed: ${error}`);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const response = await apiClient.register(email, password, displayName);
      
      const userData: User = {
        uid: response.uid,
        email: response.email,
        displayName: response.name || displayName,
        token: 'temp-token' // Register endpoint returns RegisterResponse, not LoginResponse
      };

      // Store in localStorage
      localStorage.setItem('legalai_user', JSON.stringify({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName
      }));
      localStorage.setItem('legalai_token', userData.token);

      // Set token in API client
      apiClient.setAuthToken(userData.token);
      
      setUser(userData);
    } catch (error) {
      throw new Error(`Registration failed: ${error}`);
    }
  };

  const googleSignIn = async (idToken: string) => {
    try {
      const response = await apiClient.googleSignIn(idToken);
      
      const userData: User = {
        uid: response.uid,
        email: response.email,
        displayName: response.name || response.email.split('@')[0],
        token: idToken // Use the provided idToken
      };

      // Store in localStorage
      localStorage.setItem('legalai_user', JSON.stringify({
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName
      }));
      localStorage.setItem('legalai_token', userData.token);

      // Set token in API client
      apiClient.setAuthToken(userData.token);
      
      setUser(userData);
    } catch (error) {
      throw new Error(`Google sign-in failed: ${error}`);
    }
  };

  const logout = () => {
    // Clear all localStorage data
    localStorage.removeItem('legalai_user');
    localStorage.removeItem('legalai_token');
    localStorage.removeItem('legalai_chat_messages');
    localStorage.removeItem('legalai_file_hash');
    localStorage.removeItem('legalai_uploaded_files');
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear API client token
    apiClient.clearAuthToken();
    
    setUser(null);
    
    // Redirect to login page
    window.location.href = '/login';
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    googleSignIn,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
