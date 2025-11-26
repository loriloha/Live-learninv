"use client";

import {
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Input,
  Icon,
  IconProps,
  SimpleGrid,
  Stack,
  Text,
  // Removed useToast as it is not available in v3
} from "@chakra-ui/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useProtectedRoute } from "../../../../hooks/useProtectedRoute";
import { useAuth } from "../../../../modules/auth/AuthContext";
import { apiFetch } from "../../../../lib/api-client";
import { Lesson } from "../../../../types/lesson";
import { VideoTile } from "../../../../components/VideoTile";
import { useWebRTC } from "../../../../hooks/useWebRTC";

// Custom Icons with proper Types

const MicIcon = (props: IconProps) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12 15a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v7a3 3 0 0 0 3 3zm5-3a1 1 0 0 0-2 0 3 3 0 0 1-6 0 1 1 0 0 0-2 0 5 5 0 0 0 4 4.9V19H8v2h8v-2h-3v-2.1A5 5 0 0 0 17 12z"
    />
  </Icon>
);

const CameraIcon = (props: IconProps) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M17 7h-6a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-2a4 4 0 0 0-4-4zm5 2.5-3 2.25v-2a2 2 0 0 1 2-2h1zm-5 7.5h-6a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2z"
    />
  </Icon>
);

const EndCallIcon = (props: IconProps) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M6.62 10.79a15.05 15.05 0 0 1 10.76 0l1.83-1.83a2 2 0 0 1 2.83 0l1.54 1.54a2 2 0 0 1 0 2.83l-2.7 2.7a2 2 0 0 1-2.12.48 20.68 20.68 0 0 0-12.6 0 2 2 0 0 1-2.12-.48l-2.7-2.7a2 2 0 0 1 0-2.83l1.54-1.54a2 2 0 0 1 2.83 0z"
    />
  </Icon>
);
type PanelView = "chat" | "participants";

export default function LiveLessonPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  // removed useToast
  const { user } = useProtectedRoute();
  const { token } = useAuth();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [message, setMessage] = useState("");
  const [panelView, setPanelView] = useState<PanelView>("chat");
  const [panelOpen, setPanelOpen] = useState(true);
  const [endingSession, setEndingSession] = useState(false);

  const {
    localStream,
    remoteStreams,
    messages,
    sendMessage,
    participants,
    isMicMuted,
    isCameraOff,
    toggleMic,
    toggleCamera,
    leaveSession,
    notifySessionEnd,
    sessionEndedBy,
  } = useWebRTC({
    lessonId: params.lessonId,
    displayName: user?.displayName ?? "Guest",
    userId: user?.id ?? "unknown",
    role: user?.role ?? "student",
  });

  useEffect(() => {
    if (!token || !params.lessonId) return;
    apiFetch<Lesson>(`/lessons/${params.lessonId}`, { token }).then(setLesson);
  }, [params.lessonId, token]);

  useEffect(() => {
    if (!lesson || !token || !user || lesson.status === "live" || user.id !== lesson.teacher.id) return;

    apiFetch<Lesson>(`/lessons/${lesson.id}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status: "live" }),
    })
      .then(setLesson)
      .catch(() => {});
  }, [lesson, token, user]);

  const handleLeave = () => {
    leaveSession();
    router.push("/dashboard");
  };

  const handleEndSession = async () => {
    if (!lesson || !token) return;
    setEndingSession(true);
    try {
      const updated = await apiFetch<Lesson>(`/lessons/${lesson.id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ status: "completed" }),
      });
      setLesson(updated);
      notifySessionEnd();
      leaveSession();
      // Toast removed, relying on redirect
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to end session:", err);
      // Optional: Add a local error state here if you want to show it in the UI
    } finally {
      setEndingSession(false);
    }
  };

  const formattedSchedule = useMemo(() => {
    if (!lesson) return "";
    return dayjs(lesson.scheduledAt).format("dddd, MMMM D, YYYY [at] h:mm A");
  }, [lesson]);

  const videoTiles = useMemo(() => {
    const tiles: React.ReactNode[] = [];

    if (localStream && user) {
      tiles.push(
        <VideoTile
          key="local"
          stream={localStream}
          label={`${user.displayName} (You)`}
          muted
          isLocal
        />
      );
    } else {
      tiles.push(
        <Box
          key="local-placeholder"
          bg="blackAlpha.600"
          rounded="2xl"
          minH="260px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          color="whiteAlpha.800"
          fontWeight="semibold"
        >
          Allow camera & microphone access to join the call
        </Box>
      );
    }

    remoteStreams.forEach((peer) => {
      tiles.push(
        <VideoTile
          key={peer.socketId}
          stream={peer.stream}
          label={peer.displayName ?? "Participant"}
        />
      );
    });

    return tiles;
  }, [localStream, remoteStreams, user]);

  if (!lesson || !user) {
    return (
      <Box textAlign="center" py={20}>
        <Text fontSize="2xl" color="gray.500">Connecting to your live room...</Text>
      </Box>
    );
  }

  const waitingFor = user.role === "teacher" ? "a student" : "the teacher";
  const hasOtherParticipants = participants.some((p) => !p.isLocal);
  const showWaitingState = !hasOtherParticipants;
  const canSendMessage = Boolean(message.trim()) && !sessionEndedBy;

  return (
    <Box bgGradient="linear(to-b, gray.900, #1a172b)" minH="100vh" py={{ base: 6, md: 10 }}>
      <Stack maxW="8xl" mx="auto" px={{ base: 4, md: 8 }} gap={6}>
        {/* Header */}
        <Flex direction={{ base: "column", md: "row" }} justify="space-between" align="center" gap={4}>
          <Box>
            <Heading size="lg" color="white">{lesson.topic}</Heading>
            <Text color="whiteAlpha.700">{formattedSchedule}</Text>
          </Box>
          <Stack direction="row" gap={3}>
            <Badge colorScheme="purple" px={3} py={1} rounded="full">
              {lesson.status.toUpperCase()}
            </Badge>
            <Badge colorScheme={lesson.student ? "green" : "orange"} px={3} py={1} rounded="full">
              {lesson.student ? "Student joined" : "Waiting for student"}
            </Badge>
          </Stack>
        </Flex>

        {/* Session Ended Alert - Updated structure for v3 */}
        {sessionEndedBy && (
          <Alert.Root status="warning" borderRadius="lg">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{sessionEndedBy} ended this session</Alert.Title>
              <Alert.Description>You can safely leave the room.</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        <Flex gap={6} direction={{ base: "column", xl: "row" }} align="stretch">
          {/* Main Video Area */}
          <Box flex="3" bg="blackAlpha.600" rounded="3xl" p={6} boxShadow="2xl" backdropFilter="blur(12px)">
            <Stack gap={6}>
              <Stack gap={4} minH="520px">
                <SimpleGrid columns={{ base: 1, lg: videoTiles.length > 1 ? 2 : 1 }} gap={4}>
                  {videoTiles}
                </SimpleGrid>

                {showWaitingState && (
                  <Box
                    bg="blackAlpha.500"
                    border="1px dashed"
                    borderColor="whiteAlpha.400"
                    rounded="2xl"
                    p={10}
                    textAlign="center"
                    color="whiteAlpha.700"
                  >
                    Waiting for {waitingFor} to connect...
                  </Box>
                )}
              </Stack>

              {/* Controls */}
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                <Stack direction="row" align="center" gap={3}>
                  {/* Updated AvatarGroup */}
                  <AvatarGroup size="sm">
                    {participants.map((p) => (
                      <Avatar.Root key={p.id}>
                        <Avatar.Fallback bg={p.isLocal ? "purple.500" : "gray.600"} color="white">
                          {p.displayName[0]}
                        </Avatar.Fallback>
                      </Avatar.Root>
                    ))}
                  </AvatarGroup>
                  <Text color="whiteAlpha.800">{participants.length} in call</Text>
                </Stack>

                <Stack direction={{ base: "column", sm: "row" }} gap={3}>
                  <Button
                    rounded="full"
                    bg={isMicMuted ? "red.500" : "white"}
                    color={isMicMuted ? "white" : "gray.800"}
                    onClick={toggleMic}
                  >
                    <MicIcon /> {isMicMuted ? "Unmute" : "Mute"}
                  </Button>

                  <Button
                    rounded="full"
                    bg={isCameraOff ? "red.500" : "white"}
                    color={isCameraOff ? "white" : "gray.800"}
                    onClick={toggleCamera}
                  >
                     <CameraIcon /> {isCameraOff ? "Camera on" : "Camera off"}
                  </Button>

                  <Button rounded="full" variant="outline" colorScheme="whiteAlpha" onClick={() => setPanelOpen(v => !v)}>
                    {panelOpen ? "Hide panel" : "Show panel"}
                  </Button>

                  <Button rounded="full" colorScheme="red" onClick={handleLeave}>
                    <EndCallIcon /> Leave
                  </Button>

                  {user.id === lesson.teacher.id && (
                    <Button
                      rounded="full"
                      colorScheme="pink"
                      onClick={handleEndSession}
                      loading={endingSession}
                      loadingText="Ending..."
                    >
                      End for everyone
                    </Button>
                  )}
                </Stack>
              </Flex>
            </Stack>
          </Box>

          {/* Chat / Participants Panel */}
          <Card.Root flex="1" maxH="80vh" display={panelOpen ? "flex" : "none"} flexDirection="column" boxShadow="2xl">
            <Card.Header bg="purple.600" color="white" justifyContent="space-between" alignItems="center">
              <Heading size="sm">{panelView === "chat" ? "Live chat" : "Participants"}</Heading>
              <Stack direction="row" gap={2}>
                <Button size="sm" variant={panelView === "chat" ? "solid" : "ghost"} onClick={() => setPanelView("chat")}>
                  Chat
                </Button>
                <Button size="sm" variant={panelView === "participants" ? "solid" : "ghost"} onClick={() => setPanelView("participants")}>
                  People
                </Button>
              </Stack>
            </Card.Header>

            <Card.Body p={0} flex="1" bg="gray.50">
              {panelView === "chat" ? (
                <>
                  <Box flex="1" overflowY="auto" p={6}>
                    <Stack gap={4}>
                      {messages.length === 0 ? (
                        <Text color="gray.500" textAlign="center">No messages yet</Text>
                      ) : (
                        messages.map((msg, i) => {
                          const isSelf = msg.senderId === user.id;
                          return (
                            <Box key={i} alignSelf={isSelf ? "flex-end" : "flex-start"} maxW="80%">
                              <Box
                                bg={isSelf ? "purple.500" : "white"}
                                color={isSelf ? "white" : "gray.800"}
                                px={4}
                                py={3}
                                rounded="2xl"
                                roundedTopLeft={isSelf ? "2xl" : "md"}
                                roundedTopRight={isSelf ? "md" : "2xl"}
                                boxShadow="md"
                              >
                                <Text fontSize="xs" fontWeight="bold" opacity={0.8} mb={1}>
                                  {msg.senderName}
                                </Text>
                                <Text fontSize="sm">{msg.message}</Text>
                              </Box>
                              <Text fontSize="xs" color="gray.500" textAlign={isSelf ? "right" : "left"} mt={1}>
                                {dayjs(msg.sentAt).format("h:mm A")}
                              </Text>
                            </Box>
                          );
                        })
                      )}
                    </Stack>
                  </Box>

                  <Box
                    as="form"
                    onSubmit={(e: React.FormEvent) => {
                      e.preventDefault();
                      if (!canSendMessage) return;
                      sendMessage(message);
                      setMessage("");
                    }}
                    p={4}
                    bg="white"
                    borderTop="1px solid"
                    borderColor="gray.200"
                    display="flex"
                    gap={3}
                  >
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={sessionEndedBy ? "Session has ended" : "Type a message..."}
                      disabled={Boolean(sessionEndedBy)}
                      flex="1"
                    />
                    <Button type="submit" colorScheme="purple" disabled={!canSendMessage}>
                      Send
                    </Button>
                  </Box>
                </>
              ) : (
                <Box p={6}>
                  <Stack gap={3}>
                    {participants.map((p) => (
                      <Flex key={p.id} justify="space-between" align="center" bg="white" px={4} py={3} rounded="lg" boxShadow="sm">
                        <Text fontWeight="semibold">{p.displayName}</Text>
                        {p.isLocal && <Badge colorScheme="purple">You</Badge>}
                      </Flex>
                    ))}
                  </Stack>
                </Box>
              )}
            </Card.Body>
          </Card.Root>
        </Flex>
      </Stack>
    </Box>
  );
}