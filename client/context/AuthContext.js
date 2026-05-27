import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext =
  createContext();

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    if (
      typeof window !==
      "undefined"
    ) {
      const savedUser =
        localStorage.getItem(
          "user"
        );

      if (savedUser) {
        setUser(
          JSON.parse(savedUser)
        );
      }
    }

    setLoading(false);
  }, []);

  const login = (
    userData,
    token
  ) => {
    console.log(
      "USER DATA SAVED:",
      userData
    );

    localStorage.setItem(
      "user",
      JSON.stringify(
        userData
      )
    );

    localStorage.setItem(
      "token",
      token
    );

    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(
      "user"
    );

    localStorage.removeItem(
      "token"
    );

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth =
  () =>
    useContext(
      AuthContext
    );