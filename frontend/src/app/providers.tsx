"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { AuthProvider } from "../modules/auth/AuthContext";

// Chakra UI v3 requires a system to be passed to ChakraProvider
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={defaultSystem}>
      <AuthProvider>{children}</AuthProvider>
    </ChakraProvider>
  );
}

