"use client";

import { Box } from "@chakra-ui/react";
import { ReactNode } from "react";
import { Navbar } from "./Navbar";

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Box as="main" maxW="8xl" mx="auto" px={{ base: 6, md: 12 }} py={10}>
        {children}
      </Box>
    </Box>
  );
}