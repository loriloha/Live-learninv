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

  // WebRTC + Chat hook
  const { localStream, remoteStreams, messages, sendMessage } = useWebRTC(
    params.lessonId,
    user?.displayName ?? "Guest"
  );

  // Load lesson details
  useEffect(() => {
    if (!token || !params.lessonId) return;

    apiFetch<Lesson>(`/lessons/${params.lessonId}`, { token })
      .then(setLesson)
      .catch((err) => {
        console.error("Failed to load lesson:", err);
      });
  }, [params.lessonId, token]);

  // Show loading state
  if (!lesson || !user) {
    return (
      <Box textAlign="center" mt={20}>
        <Text fontSize="xl" color="gray.500">
          Connecting to live room...
        </Text>
      </Box>
    );
  }

  return (
    <Box maxW="8xl" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      {/* Header */}
      <Stack gap={2} mb={8}>
        <Heading size="xl">{lesson.topic}</Heading>
        <Text color="gray.600" fontWeight="medium">
          {dayjs(lesson.scheduledAt).format("dddd, MMMM D, YYYY [at] h:mm A")}
        </Text>
        <Text fontSize="sm" color="gray.500">
          {user.role === "teacher" ? "You are the teacher" : `Teacher: ${lesson.teacher.displayName}`}
        </Text>
      </Stack>

      {/* Main Layout: Video + Chat */}
      <Flex
        gap={{ base: 6, lg: 8 }}
        flexDir={{ base: "column", lg: "row" }}
        alignItems="flex-start"
      >
        {/* Video Section */}
        <Stack flex="2" gap={6} w="full">
          {/* Local Video (You) */}
          {localStream ? (
            <VideoTile
              stream={localStream}
              label={`${user.displayName} (You)`}
              muted
              isLocal
            />
          ) : (
            <Box
              bg="gray.200"
              rounded="xl"
              h="400px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              border="2px dashed"
              borderColor="gray.400"
            >
              <Text color="gray.600">Camera initializing...</Text>
            </Box>
          )}

          {/* Remote Videos */}
          {remoteStreams.length > 0 ? (
            remoteStreams.map((remote) => (
              <VideoTile
                key={remote.socketId}
                stream={remote.stream}
                label={remote.displayName || "Participant"}
              />
            ))
          ) : (
            <Box
              bg="gray.50"
              rounded="xl"
              p={10}
              textAlign="center"
              border="2px dashed"
              borderColor="gray.300"
            >
              <Text fontSize="lg" color="gray.500">
                Waiting for {user.role === "teacher" ? "student" : "teacher"} to join...
              </Text>
            </Box>
          )}
        </Stack>

        {/* Chat Sidebar */}
        <Card.Root flex="1" minW="320px" maxH="700px" alignSelf="stretch">
          <Card.Header>
            <Heading size="md">Live Chat</Heading>
          </Card.Header>

          <Card.Body display="flex" flexDir="column" gap={4} p={0}>
            {/* Messages */}
            <Box flex="1" overflowY="auto" px={6} pb={4}>
              <Stack gap={4}>
                {messages.length === 0 ? (
                  <Text color="gray.500" fontSize="sm">
                    No messages yet. Say hello!
                  </Text>
                ) : (
                  messages.map((msg, i) => (
                    <Box
                      key={i}
                      alignSelf={msg.senderId === user.id ? "flex-end" : "flex-start"}
                      maxW="80%"
                    >
                      <Box
                        bg={msg.senderId === user.id ? "purple.500" : "gray.100"}
                        color={msg.senderId === user.id ? "white" : "gray.800"}
                        px={4}
                        py={2}
                        rounded="lg"
                        roundedBottomLeft={msg.senderId === user.id ? "lg" : "sm"}
                        roundedBottomRight={msg.senderId === user.id ? "sm" : "lg"}
                      >
                        <Text fontSize="sm" fontWeight="bold" opacity={0.9}>
                          {msg.senderName}
                        </Text>
                        <Text fontSize="sm">{msg.message}</Text>
                      </Box>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        textAlign={msg.senderId === user.id ? "right" : "left"}
                        mt={1}
                      >
                        {dayjs(msg.sentAt).format("h:mm A")}
                      </Text>
                    </Box>
                  ))
                )}
              </Stack>
            </Box>

            <Separator />

            {/* Message Input */}
            <Flex
              as="form"
              px={6}
              pb={4}
              gap={3}
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
                variant="filled"
                flex="1"
              />
              <Button type="submit" colorScheme="purple" isDisabled={!message.trim()}>
                Send
              </Button>
            </Flex>
          </Card.Body>
        </Card.Root>
      </Flex>
    </Box>
  );
}