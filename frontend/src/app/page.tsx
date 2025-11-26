// src/app/page.tsx
"use client";

import {
  Box,
  Button,
  Grid,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";

export default function Home() {
  return (
    <Stack gap={12} py={12} px={{ base: 6, lg: 12 }} maxW="8xl" mx="auto">
      <Grid
        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
        gap={{ base: 12, lg: 16 }}
        alignItems="center"
      >
        <Stack gap={8}>
          <Heading size="3xl" fontWeight="extrabold">
            Live, free learning for everyone.
          </Heading>
          <Text fontSize="xl" color="gray.600" lineHeight="tall">
            Host real-time lessons, meet 1:1 over WebRTC video, chat, and keep a
            simple schedule — powered entirely by open-source tools.
          </Text>
          <Stack direction={{ base: "column", sm: "row" }} gap={4}>
            <NextLink href="/register">
              <Button colorScheme="purple" size="lg" px={8}>
                Get started
              </Button>
            </NextLink>
            <NextLink href="/dashboard">
              <Button variant="outline" size="lg" px={8}>
                Launch dashboard
              </Button>
            </NextLink>
          </Stack>
        </Stack>

        <Box
          bg="white"
          p={10}
          rounded="2xl"
          shadow="2xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <Heading size="xl" mb={8} color="purple.700">
            What you get
          </Heading>
          <Stack as="ul" gap={5} pl={8}>
            <Box as="li" fontSize="lg" fontWeight="medium">
              Secure email/password authentication
            </Box>
            <Box as="li" fontSize="lg" fontWeight="medium">
              One-to-one HD video powered by WebRTC
            </Box>
            <Box as="li" fontSize="lg" fontWeight="medium">
              Instant chat via WebSockets
            </Box>
            <Box as="li" fontSize="lg" fontWeight="medium">
              Teacher scheduling & lesson joins
            </Box>
          </Stack>
        </Box>
      </Grid>

      {/* Features Grid */}
      <SimpleGrid
        columns={{ base: 1, md: 3 }}
        gap={8}
      >
        {[
          { title: "Free stack", body: "NestJS + Next.js + SQLite + Socket.IO" },
          {
            title: "Privacy-first",
            body: "Own your data locally or on free cloud PostgreSQL.",
          },
          {
            title: "Deploy anywhere",
            body: "Backend on Render/Railway, frontend on Vercel — $0 tiers.",
          },
        ].map((item) => (
          <Box
            key={item.title}
            bg="white"
            p={8}
            rounded="2xl"
            shadow="lg"
            border="1px solid"
            borderColor="gray.200"
            textAlign="center"
            transition="transform 0.2s"
            _hover={{ transform: "translateY(-8px)", shadow: "xl" }}
          >
            <Heading size="lg" mb={4} color="purple.600">
              {item.title}
            </Heading>
            <Text color="gray.700" fontSize="lg">
              {item.body}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Stack>
  );
}