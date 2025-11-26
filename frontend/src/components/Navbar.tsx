"use client";

import NextLink from "next/link";
import { Box, Button, Flex, HStack, Spacer, Text } from "@chakra-ui/react";
import { useAuth } from "../modules/auth/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();
  return (
    <Box as="header" borderBottom="1px solid #eee" py={4} px={6}>
      <Flex align="center">
        <NextLink href="/">
          <Text fontWeight="bold" color="brand.600">
            Live Learning
          </Text>
        </NextLink>
        <Spacer />
        <HStack spacing={4}>
          {user ? (
            <>
              <Text fontSize="sm">
                {user.displayName} · {user.role}
              </Text>
              <NextLink href="/dashboard">
                <Button size="sm" colorScheme="purple">
                  Dashboard
                </Button>
              </NextLink>
              <Button size="sm" variant="outline" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <NextLink href="/login">
                <Button size="sm" variant="ghost">
                  Log in
                </Button>
              </NextLink>
              <NextLink href="/register">
                <Button size="sm" colorScheme="purple">
                  Get started
                </Button>
              </NextLink>
            </>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}

