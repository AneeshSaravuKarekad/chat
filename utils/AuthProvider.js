import { createContext, useEffect, useState, useContext } from "react";
import { signInAnonymously, onAuthStateChanged } from "@firebase/auth";
import { auth } from "../config/firebase";

const AuthContext = createContext({ uid: null });

export const AuthProvider = ({ children }) => {
  const [error, setError] = useState();
  const [uid, setUid] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        try {
          const userCredentials = await signInAnonymously(auth);
          setUid(userCredentials.user.uid);
          setError(null);
        } catch (error) {
          setError(error);
        }
      } else {
        setUid(user.uid);
      }
    });

    return () => unsubscribe();
  }, [uid]);

  return (
    <AuthContext.Provider value={{ uid, error, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default function useAuth() {
  return useContext(AuthContext);
}
