import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth, clearLoginTime, isSessionExpired } from "../lib/firebase";

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(auth !== null);

  useEffect(() => {
    if (!auth) return;
    const client = auth;

    const unsubscribe = onAuthStateChanged(client, (next) => {
      if (next && isSessionExpired(next.uid)) {
        clearLoginTime(next.uid);
        void signOut(client);
        setUser(null);
      } else {
        setUser(next);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
