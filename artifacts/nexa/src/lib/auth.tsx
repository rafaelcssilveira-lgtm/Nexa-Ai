import React, { createContext, useContext } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import type { AuthUser } from "@workspace/api-client-react";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  refresh: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: user, isLoading, refetch, isError } = useGetMe({
    query: {
      retry: false,
      staleTime: Infinity,
      queryKey: getGetMeQueryKey(),
    }
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated: !!user && !isError,
        refresh: () => { void refetch(); },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
