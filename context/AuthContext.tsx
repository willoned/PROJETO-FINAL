import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('iv_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Validate Token on Mount
    const validateToken = async () => {
      const storedToken = localStorage.getItem('iv_token');
      if (storedToken) {
        
        // --- DEMO / PREVIEW MODE BYPASS ---
        // If we are in preview mode without a real backend, we accept the demo token.
        if (storedToken.startsWith('DEMO_TOKEN')) {
            setUser({ id: 1, username: 'admin', role: 'ADMIN' });
            setToken(storedToken);
            setIsLoading(false);
            return;
        }
        // ----------------------------------

        try {
          // Development proxy handles /api to localhost:3000
          // In production server.js serves both
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(storedToken);
          } else {
            logout();
          }
        } catch (error) {
          console.error("Auth validation failed", error);
          // Don't auto-logout immediately on network error to prevent flashing, 
          // but for security we should probably verify. 
          // For now, if API is dead, we logout unless it was a Demo token.
          logout();
        }
      }
      setIsLoading(false);
    };

    validateToken();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('iv_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('iv_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        token, 
        isAuthenticated: !!user, 
        isLoading,
        login, 
        logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};