import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('ssb_user');
    const savedToken = localStorage.getItem('ssb_token');
    
    if (savedUser && savedToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('ssb_user');
        localStorage.removeItem('ssb_token');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data with specific credentials
      const mockUsers = {
        admin: {
          id: 1,
          name: 'Admin User',
          email: 'admin@ssb.com',
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          avatar: null,
          permissions: ['read', 'write', 'delete', 'manage_users', 'manage_buses', 'manage_drivers']
        },
        driver: {
          id: 2,
          name: 'Driver User',
          email: 'driver@ssb.com',
          username: 'driver',
          password: 'driver123',
          role: 'driver',
          avatar: null,
          permissions: ['read', 'write', 'manage_trips', 'report_incidents']
        },
        parent: {
          id: 3,
          name: 'Parent User',
          email: 'parent@ssb.com',
          username: 'parent',
          password: 'parent123',
          role: 'parent',
          avatar: null,
          permissions: ['read', 'track_children']
        }
      };

      // Check credentials
      const userData = mockUsers[credentials.role];
      if (!userData) {
        return { success: false, error: 'Vai trò không hợp lệ' };
      }

      // Simple credential check (in real app, this would be server-side)
      if (credentials.username !== userData.username || credentials.password !== userData.password) {
        return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
      }

      const token = `mock_token_${Date.now()}`;

      // Save to localStorage
      localStorage.setItem('ssb_user', JSON.stringify(userData));
      localStorage.setItem('ssb_token', token);

      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock registration response
      const newUser = {
        id: Date.now(),
        name: userData.fullName,
        email: userData.email,
        role: userData.role,
        avatar: null,
        permissions: userData.role === 'parent' ? ['read', 'track_children'] : ['read', 'write']
      };

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('ssb_user');
    localStorage.removeItem('ssb_token');
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('ssb_user', JSON.stringify(updatedUser));
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user.role === role;
  };

  const hasAnyRole = (roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    hasPermission,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
