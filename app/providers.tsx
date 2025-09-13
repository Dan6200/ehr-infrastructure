"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import { Provider as JotaiProvider } from "jotai";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getEncryptionKey } from "@/app/admin/actions/get-encryption-key"; // Our Server Action

// Define the shape of our context value
interface EncryptionKeyContextType {
  encryptionKey: string | null;
  loadingKey: boolean;
  errorKey: string | null;
}

// Create the context
const EncryptionKeyContext = createContext<EncryptionKeyContextType | undefined>(undefined);

// Custom hook to use the encryption key
export const useEncryptionKey = () => {
  const context = useContext(EncryptionKeyContext);
  if (context === undefined) {
    throw new Error("useEncryptionKey must be used within an EncryptionKeyProvider");
  }
  return context;
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState<boolean>(true);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setLoadingKey(true);
          setErrorKey(null);
          const idToken = await user.getIdToken();
          const { key, error } = await getEncryptionKey(idToken);
          if (key) {
            setEncryptionKey(key);
          } else if (error) {
            setErrorKey(error);
            console.error("Failed to fetch encryption key:", error);
          }
        } catch (err) {
          setErrorKey("An unexpected error occurred while fetching the encryption key.");
          console.error("Error fetching encryption key:", err);
        } finally {
          setLoadingKey(false);
        }
      } else {
        // User logged out
        setEncryptionKey(null);
        setLoadingKey(false);
        setErrorKey(null);
      }
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  return (
    <JotaiProvider>
      <EncryptionKeyContext.Provider value={{ encryptionKey, loadingKey, errorKey }}>
        {children}
      </EncryptionKeyContext.Provider>
    </JotaiProvider>
  );
}