"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../modules/auth/AuthContext";

export function useProtectedRoute() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  return { user, loading };
}

