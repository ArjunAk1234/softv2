import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("user");
      
      // Better validation - check if both exist and user is valid JSON
      if (token && user) {
        const parsedUser = JSON.parse(user);
        // Validate that user object has required properties
        if (parsedUser && typeof parsedUser === 'object') {
          return { token, user: parsedUser };
        }
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      // Clear corrupted data
      localStorage.clear();
    }
    return null;
  });

  const login = (token, user) => {
    try {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setAuth({ token, user });
    } catch (error) {
      console.error('Error storing auth data:', error);
    }
  };

  const logout = () => {
    try {
      localStorage.clear();
      setAuth(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still set auth to null even if localStorage fails
      setAuth(null);
    }
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};