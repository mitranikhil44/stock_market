"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // store user object
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // JWT ya localStorage ya API check
    const token = localStorage.getItem("token");

    if (token) {
      // yaha API call karke verify karna chaho toh kar sakte ho
      setUser({ token }); 
    } else {
      setUser(null);
      router.push("/login"); // redirect to login
    }

    setLoading(false);
  }, [router]);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
