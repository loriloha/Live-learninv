"use client";

import NextLink from "next/link";
import {
  Box,
  Button,
  Flex,
  HStack,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { useAuth } from "../modules/auth/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <Box
      as="header"
      borderBottom="1px solid"
      borderColor="gray.200"
      py={4}
      px={{ base: 4, md: 8 }}
      bg="white"
      position="sticky"
      top={0}
      zIndex="banner"
      boxShadow="sm"
    >
      <Flex align="center" maxW="8xl" mx="auto">
        <NextLink href="/">
          <Text
            fontSize="xl"
            fontWeight="bold"
            color="purple.600"
            _hover={{ color: "purple.700" }}
            cursor="pointer"
          >
            Live Learning
          </Text>
        </NextLink>

        <Spacer />

        {/* Replace spacing → gap */}
        <HStack gap={4}>
          {user ? (
            <>
              <Text fontSize="sm" fontWeight="medium">
                {user.displayName} ·{" "}
                <Text as="span" textTransform="capitalize">
                  {user.role}
                </Text>
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