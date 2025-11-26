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
    <Stack spacing={10}>
      <Grid
        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
        gap={12}
        alignItems="center"
      >
        <Stack spacing={6}>
          <Heading size="2xl">Live, free learning for everyone.</Heading>
          <Text fontSize="lg" color="gray.600">
            Host real-time lessons, meet 1:1 over WebRTC video, chat, and keep a
            simple schedule—powered entirely by open-source tools.
          </Text>
          <Stack direction={{ base: "column", sm: "row" }} spacing={4}>
            <NextLink href="/register">
              <Button colorScheme="purple" size="lg">
                Get started
              </Button>
            </NextLink>
            <NextLink href="/dashboard">
              <Button variant="outline" size="lg">
                Launch dashboard
              </Button>
            </NextLink>
          </Stack>
        </Stack>
        <Box
          bg="white"
          p={6}
          rounded="xl"
          shadow="lg"
          border="1px solid"
          borderColor="gray.100"
        >
          <Heading size="md" mb={4}>
            What you get
          </Heading>
          <Stack as="ul" spacing={3} listStyleType="disc" pl={6}>
            <Box as="li">Secure email/password authentication</Box>
            <Box as="li">One-to-one HD video powered by WebRTC</Box>
            <Box as="li">Instant chat via WebSockets</Box>
            <Box as="li">Teacher scheduling & lesson joins</Box>
          </Stack>
        </Box>
      </Grid>
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        {[
          { title: "Free stack", body: "NestJS + Next.js + SQLite + Socket.IO" },
          {
            title: "Privacy-first",
            body: "Own your data locally or on free cloud PostgreSQL.",
          },
          {
            title: "Deploy anywhere",
            body: "Backend on Render/Railway, frontend on Vercel—$0 tiers.",
          },
        ].map((item) => (
          <Box key={item.title} bg="white" p={5} rounded="lg" shadow="sm">
            <Heading size="md" mb={2}>
              {item.title}
            </Heading>
            <Text color="gray.600">{item.body}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
