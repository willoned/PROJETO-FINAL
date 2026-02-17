import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded Developer Credentials
const DEV_USER: User = {
    username: 'Willon',
    role: 'ADMIN',
    permissions: ['LINES', 'API', 'LAYOUT', 'MEDIA', 'ALERTS', 'PARTY', 'HEADER']
};
const DEV_PASS = '12112020';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current logged in user
  const [user, setUser] = useState<User | null>(null);
  
  // List of all registered users (simulated DB in localStorage)
  const [usersList, setUsersList] = useState<User[]>(() => {
      const saved = localStorage.getItem('IV_USERS_DB');
      return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
      localStorage.setItem('IV_USERS_DB', JSON.stringify(usersList));
  }, [usersList]);

  const login = async (username: string, pass: string): Promise<boolean> => {
    // 1. Check Developer Access
    if (username === DEV_USER.username && pass === DEV_PASS) {
        setUser(DEV_USER);
        return true;
    }

    // 2. Check created users
    const foundUser = usersList.find(u => u.username === username && u.password === pass);
    if (foundUser) {
        setUser(foundUser);
        return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const createUser = (newUser: User) => {
      // Prevent duplicates
      if (usersList.some(u => u.username === newUser.username)) {
          alert('Usuário já existe!');
          return;
      }
      setUsersList(prev => [...prev, newUser]);
  };

  const deleteUser = (username: string) => {
      setUsersList(prev => prev.filter(u => u.username !== username));
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        usersList,
        login, 
        logout, 
        createUser,
        deleteUser,
        isAuthenticated: !!user
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
