"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const ProtectedRoute = ({ children }) => {
  const router = useRouter();

  useEffect(() => {
    const checkUserToken = () => {
      try {
        const userToken = localStorage.getItem("token");
        if (!userToken) {
          router.push("/sign_in");
        }
      } catch (error) {
        console.error("Error checking user token:", error);
        router.push("/error"); 
      }
    };

    checkUserToken();
  }, [router]);

  return children;
};

export default ProtectedRoute;
