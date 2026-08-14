"use client";

import {
  type Auth,
  type User,
  type UserCredential,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getFirebaseAuth } from "./firebase/client";
import { isFirebaseConfigured } from "./firebase/env";

export type AuthStatus =
  | "loading"
  | "authenticated"
  | "unauthenticated"
  | "misconfigured";

export interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  auth: Auth | null;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithEmail: (email: string, password: string) => Promise<UserCredential>;
  registerWithEmail: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<UserCredential>;
  resetPassword: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useMemo<Auth | null>(() => getFirebaseAuth(), []);
  const configured = useMemo(() => isFirebaseConfigured(), []);

  const [user, setUser] = useState<User | null>(null);
  const [resolved, setResolved] = useState(auth === null);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setResolved(true);
    });
    return () => unsub();
  }, [auth]);

  const signInWithGoogle = useCallback(() => {
    if (!auth) throw new Error("Auth not initialised");
    const provider = new GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");
    return signInWithPopup(auth, provider);
  }, [auth]);

  const signInWithEmail = useCallback(
    (email: string, password: string) => {
      if (!auth) throw new Error("Auth not initialised");
      return signInWithEmailAndPassword(auth, email, password);
    },
    [auth],
  );

  const registerWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      if (!auth) throw new Error("Auth not initialised");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName && cred.user) {
        await updateProfile(cred.user, { displayName });
      }
      return cred;
    },
    [auth],
  );

  const resetPassword = useCallback(
    (email: string) => {
      if (!auth) throw new Error("Auth not initialised");
      return sendPasswordResetEmail(auth, email);
    },
    [auth],
  );

  const signOutUser = useCallback(() => {
    if (!auth) return Promise.resolve();
    return signOut(auth);
  }, [auth]);

  const status: AuthStatus = !configured
    ? "misconfigured"
    : !resolved
      ? "loading"
      : user
        ? "authenticated"
        : "unauthenticated";

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      auth,
      signInWithGoogle,
      signInWithEmail,
      registerWithEmail,
      resetPassword,
      signOutUser,
    }),
    [
      status,
      user,
      auth,
      signInWithGoogle,
      signInWithEmail,
      registerWithEmail,
      resetPassword,
      signOutUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
