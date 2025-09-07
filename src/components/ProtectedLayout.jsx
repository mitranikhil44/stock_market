"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // Ye pages sabke liye open rahenge
  const publicRoutes = ["/", "/about", "/login", "/register", "/optiondata", "/analysis"];

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Agar route public hai, auth check skip karo
    if (publicRoutes.includes(pathname)) {
      setLoading(false);
      return;
    }

    // Private route par agar token nahi hai → login bhejo
    if (!token) {
      router.push("/login");
    }

    // Agar user login page pe hai aur token already hai → home bhejo
    if (token && pathname === "/login") {
      router.push("/");
    }

    setLoading(false);
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg font-semibold">Checking authentication...</p>
      </div>
    );
  }

  return <>{children}</>;
}
