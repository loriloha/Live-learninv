// src/app/lessons/[lessonId]/live/page.tsx
"use client";

import {
  Box,
  Button,
  Card,
  Separator,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useProtectedRoute } from "../../../../hooks/useProtectedRoute";
import { useAuth } from "../../../../modules/auth/AuthContext";
import { apiFetch } from "../../../../lib/api-client";
import { Lesson } from "../../../../types/lesson";
import { VideoTile } from "../../../../components/VideoTile";
import { useWebRTC } from "../../../../hooks/useWebRTC";


export default function LiveLessonPage() {
  const params = useParams<{ lessonId: string }>();
  const { user } = useProtectedRoute();
  const { token } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [message, setMessage] = useState("");

  const { localStream, remoteStreams, messages, sendMessage } = useWebRTC(
    params.lessonId,
    user?.displayName ?? "Guest"
  );

  useEffect(() => {
    if (!token || !params.lessonId) return;
    apiFetch<Lesson>(`/lessons/${params.lessonId}`, { token }).then(setLesson);
  }, [params.lessonId, token]);

  if (!lesson || !user) {
    return (
      <Box textAlign="center" py={20}>
        <Text fontSize="2xl" color="gray.500">Connecting...</Text>
      </Box>
    );
  }

  return (
    <Box maxW="8xl" mx="auto" px={{ base: 4, md: 8 }} py={8}>
      <Stack gap={2} mb={8}>
        <Heading size="xl" color="purple.700">{lesson.topic}</Heading>
        <Text color="gray.600">
          {dayjs(lesson.scheduledAt).format("dddd, MMMM D, YYYY [at] h:mm A")}
        </Text>
      </Stack>

      <Flex direction={{ base: "column", lg: "row" }} gap={10} align="flex-start">
        {/* Videos */}
        <Stack flex="2" gap={6} w="full">
          {localStream ? (
            <VideoTile stream={localStream} label={user.displayName} muted isLocal />
          ) : (
            <Box bg="gray.800" rounded="2xl" h="480px" display="flex" alignItems="center" justifyContent="center">
              <Text color="whiteAlpha.800">Camera loading...</Text>
            </Box>
          )}

          {remoteStreams.length > 0 ? (
            remoteStreams.map((peer) => (
              <VideoTile
                key={peer.socketId}
                stream={peer.stream}
                label={peer.displayName || "Participant"}
              />
            ))
          ) : (
            <Box bg="gray.50" rounded="2xl" p={12} textAlign="center">
              <Text fontSize="xl" color="gray.500">
                Waiting for {user.role === "teacher" ? "student" : "teacher"}...
              </Text>
            </Box>
          )}
        </Stack>

        {/* Chat */}
        <Card.Root flex="1" minW="360px" maxH="720px" shadow="xl">
          <Card.Header bg="purple.600" color="white">
            <Heading size="md" textAlign="center">Live Chat</Heading>
          </Card.Header>

          <Card.Body p={0} display="flex" flexDir="column">
            <Box flex="1" overflowY="auto" p={6}>
              <Stack gap={4}>
                {messages.length === 0 ? (
                  <Text color="gray.500" textAlign="center">No messages yet</Text>
                ) : (
                  messages.map((msg, i) => (
                    <Box
                      key={i}
                      alignSelf={msg.senderId === user.id ? "flex-end" : "flex-start"}
                      maxW="80%"
                    >
                      <Box
                        bg={msg.senderId === user.id ? "purple.500" : "gray.200"}
                        color={msg.senderId === user.id ? "white" : "gray.800"}
                        px={4}
                        py={3}
                        rounded="2xl"
                        roundedTopLeft={msg.senderId === user.id ? "2xl" : "md"}
                        roundedTopRight={msg.senderId === user.id ? "md" : "2xl"}
                      >
                        <Text fontSize="xs" fontWeight="bold" opacity={0.9} mb={1}>
                          {msg.senderName}
                        </Text>
                        <Text fontSize="sm">{msg.message}</Text>
                      </Box>
                      <Text fontSize="xs" color="gray.500" textAlign={msg.senderId === user.id ? "right" : "left"} mt={1}>
                        {dayjs(msg.sentAt).format("h:mm A")}
                      </Text>
                    </Box>
                  ))
                )}
              </Stack>
            </Box>

            <Separator />

            <Flex
              as="form"
              p={4}
              gap={3}
              bg="gray.50"
              onSubmit={(e) => {
                e.preventDefault();
                if (message.trim()) {
                  sendMessage(message);
                  setMessage("");
                }
              }}
            >
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                variant="outline"   // ← Fixed: was "filled"
                flex="1"
              />
              <Button
                type="submit"
                colorScheme="purple"
                disabled={!message.trim()}  // ← Fixed: was isDisabled
                px={8}
              >
                Send
              </Button>
            </Flex>
          </Card.Body>
        </Card.Root>
      </Flex>
    </Box>
  );
}