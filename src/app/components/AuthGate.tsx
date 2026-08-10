"use client";

import { useRouter } from "next/navigation";
import { memo, useEffect } from "react";
import { useAuth } from "../../lib/auth-context";
import SplashScreen from "./SplashScreen";

interface AuthGateProps {
  children: React.ReactNode;
}

const AuthGateInner = function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const { status } = useAuth();

  console.log("AuthGate status:", status);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return <SplashScreen message="Checking session…" />;
  }
  if (status === "misconfigured") {
    return (
      <SplashScreen message="Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* to .env.local" />
    );
  }
  if (status === "unauthenticated") {
    return null;
  }
  return <>{children}</>;
};

export const AuthGate = memo(AuthGateInner);
