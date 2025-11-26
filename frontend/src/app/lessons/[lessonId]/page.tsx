"use client";

import {
  Badge,
  Button,
  Card,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/toast";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { apiFetch } from "../../../lib/api-client";
import { Lesson } from "../../../types/lesson";
import { useProtectedRoute } from "../../../hooks/useProtectedRoute";
import { useAuth } from "../../../modules/auth/AuthContext";

export default function LessonDetailsPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const { user } = useProtectedRoute();
  const { token } = useAuth();
  const toast = useToast();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token || !params.lessonId) return;

    apiFetch<Lesson>(`/lessons/${params.lessonId}`, { token })
      .then(setLesson)
      .catch(() => {
        toast({ title: "Lesson not found", status: "error" });
        router.push("/dashboard");
      });
  }, [params.lessonId, token, toast, router]);

  const handleJoin = async () => {
    if (!token || !params.lessonId || lesson?.student) return;

    setJoining(true);
    try {
      const updated = await apiFetch<Lesson>(`/lessons/${params.lessonId}/join`, {
        method: "POST",
        token,
      });
      setLesson(updated);
      toast({ title: "Successfully joined!", status: "success" });
    } catch (err) {
      toast({ title: "Failed to join", status: "error" });
    } finally {
      setJoining(false);
    }
  };

  if (!lesson || !user) {
    return <Text textAlign="center" mt={20}>Loading lesson details...</Text>;
  }

  const isParticipant = user.id === lesson.teacher.id || user.id === lesson.student?.id;

  return (
    <Card.Root maxW="3xl" mx="auto" mt={10} shadow="xl">
      <Card.Body>
        <Stack gap={6}>
          <Heading size="lg">{lesson.topic}</Heading>

          {lesson.description && (
            <Text fontSize="lg" color="gray.700">
              {lesson.description}
            </Text>
          )}

          <Text fontWeight="bold" color="purple.600">
            {dayjs(lesson.scheduledAt).format("dddd, MMMM D, YYYY [at] h:mm A")}
          </Text>

          <Stack direction="row" gap={4} flexWrap="wrap">
            <Badge colorScheme="blue" fontSize="sm" p={2}>
              Teacher: {lesson.teacher.displayName}
            </Badge>
            <Badge colorScheme={lesson.student ? "green" : "orange"} fontSize="sm" p={2}>
              Student: {lesson.student ? lesson.student.displayName : "Available"}
            </Badge>
            <Badge colorScheme="purple">{lesson.status}</Badge>
          </Stack>

          <Stack direction={{ base: "column", sm: "row" }} gap={4} mt={6}>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              ← Back to Dashboard
            </Button>

            {user.role === "student" && !lesson.student && (
              <Button
                colorScheme="purple"
                onClick={handleJoin}
                loading={joining}
                loadingText="Joining..."
              >
                Join This Lesson
              </Button>
            )}

            {isParticipant && (
              <Button
                colorScheme="green"
                size="lg"
                onClick={() => router.push(`/lessons/${lesson.id}/live`)}
              >
                {user.id === lesson.teacher.id ? "Start Lesson" : "Enter Live Room"}
              </Button>
            )}
          </Stack>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}