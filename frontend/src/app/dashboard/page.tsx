"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Field,
  Heading,
  Input,
  // Select as ChakraSelect, // <-- Removed the problematic import
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/toast";
import dayjs from "dayjs";
import { useEffect, useState, useCallback } from "react";
import NextLink from "next/link";
import { useProtectedRoute } from "../../hooks/useProtectedRoute";
import { useAuth } from "../../modules/auth/AuthContext";
import { apiFetch } from "../../lib/api-client";
import { Lesson } from "../../types/lesson";
import type { PublicUser } from "../../types/user";

export default function DashboardPage() {
  const { user, loading: authLoading } = useProtectedRoute();
  const { token } = useAuth();
  const toast = useToast();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    topic: "",
    description: "",
    scheduledAt: "",
    studentId: "",
  });
  const [students, setStudents] = useState<PublicUser[]>([]);
  const [requestedLessons, setRequestedLessons] = useState<
    Record<string, boolean>
  >({});

  const loadLessons = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch<Lesson[]>("/lessons", { token });
      setLessons(data);
    } catch (_) { // Cleaned up unused variable
      toast({ title: "Failed to load lessons", status: "error" });
    }
  }, [token, toast]);

  const loadStudents = useCallback(async () => {
    if (!token || user?.role !== "teacher") return;
    try {
      const data = await apiFetch<PublicUser[]>("/users?role=student", { token });
      setStudents(data);
    } catch {
      setStudents([]);
    }
  }, [token, user?.role]);

  useEffect(() => {
    if (!authLoading && token) {
      loadLessons();
      loadStudents();
    }
  }, [token, authLoading, user?.role, loadLessons, loadStudents]);

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setCreating(true);
    try {
      const scheduledAtISO = dayjs(form.scheduledAt).isValid()
        ? dayjs(form.scheduledAt).toISOString()
        : form.scheduledAt;
      await apiFetch<Lesson>("/lessons", {
        method: "POST",
        body: JSON.stringify({
          topic: form.topic,
          description: form.description,
          scheduledAt: scheduledAtISO,
          studentId: form.studentId || undefined,
        }),
        token,
      });

      toast({ title: "Lesson scheduled!", status: "success" });
      setForm({ topic: "", description: "", scheduledAt: "", studentId: "" });
      await loadLessons();
    } catch (_err) { // Cleaned up unused variable
      toast({
        title: "Failed to create lesson",
        description: (_err as Error).message,
        status: "error",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRequest = async (lessonId: string) => {
    if (!token) return;
    try {
      await apiFetch(`/lessons/${lessonId}/requests`, { method: "POST", token });
      toast({ title: "Request sent!", status: "success" });
      setRequestedLessons((prev) => ({ ...prev, [lessonId]: true }));
    } catch { // Cleaned up unused variable (removed 'err')
      toast({ title: "Could not send request", status: "error" });
    }
  };

  if (authLoading || !user) {
    return <Text textAlign="center" mt={10}>Loading...</Text>;
  }

  return (
    <Stack gap={10} maxW="6xl" mx="auto" px={4} py={8}>
      <Heading>Welcome back, {user.displayName}!</Heading>

      {/* Teacher: Schedule Lesson Form */}
      {user.role === "teacher" && (
        <Card.Root>
          <Card.Body>
            <Heading size="md" mb={6}>Schedule a New Lesson</Heading>
            <form onSubmit={handleCreateLesson}>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} mb={4}>
                <Field.Root>
                  <Field.Label>Topic</Field.Label>
                  <Input
                    value={form.topic}
                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                    placeholder="e.g. Advanced React Hooks"
                    required
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>Date & Time</Field.Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                    required
                  />
                </Field.Root>
              </SimpleGrid>

              <Field.Root>
                <Field.Label>Description (optional)</Field.Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What will students learn?"
                  rows={3}
                />
              </Field.Root>

              <Field.Root mt={4}>
                <Field.Label htmlFor="studentId">Assign Student (optional)</Field.Label>
                {/* FIX: Using native <select> instead of problematic ChakraSelect */}
                <select
                  id="studentId"
                  // Basic inline styling to mimic Chakra UI Input/Select
                  style={{
                    width: '100%', 
                    padding: '8px 12px', 
                    borderRadius: 'var(--chakra-radii-md)', 
                    border: '1px solid var(--chakra-colors-gray-200)',
                    appearance: 'none', 
                    backgroundColor: 'var(--chakra-colors-white)',
                    height: 'var(--chakra-sizes-10)',
                  }}
                  value={form.studentId}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => 
                    setForm({ ...form, studentId: e.target.value })
                  }
                  disabled={students.length === 0}
                >
                  <option value="" disabled hidden>Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.displayName} ({student.email})
                    </option>
                  ))}
                </select>
                {/* Optional visual cue placeholder: */}
                {/* <Box as="span" pos="relative" pointerEvents="none" right="10px" top="-30px" zIndex="1" color="gray.500">
                    ▼
                </Box> */}
              </Field.Root>

              <Button
                mt={6}
                type="submit"
                colorScheme="purple"
                size="lg"
                loading={creating}
                loadingText="Scheduling..."
              >
                Create Lesson
              </Button>
            </form>
          </Card.Body>
        </Card.Root>
      )}

      {/* Upcoming Lessons List */}
      <Box>
        <Heading size="md" mb={4}>Upcoming Lessons</Heading>

        {lessons.length === 0 ? (
          <Card.Root>
            <Card.Body textAlign="center" py={10}>
              <Text color="gray.500">No lessons scheduled yet.</Text>
            </Card.Body>
          </Card.Root>
        ) : (
          <Stack gap={4}>
            {lessons.map((lesson) => (
              <Card.Root key={lesson.id} _hover={{ shadow: "lg" }} transition="0.2s">
                <Card.Body>
                  <Stack gap={3}>
                    <Heading size="md">{lesson.topic}</Heading>
                    {lesson.description && (
                      <Text color="gray.600">{lesson.description}</Text>
                    )}
                    <Text fontSize="sm" fontWeight="medium">
                      {dayjs(lesson.scheduledAt).format("dddd, MMMM D, YYYY [at] h:mm A")}
                    </Text>

                    <Box>
                      <Badge colorScheme="purple" mr={2}>{lesson.status}</Badge>
                      <Badge>Teacher: {lesson.teacher.displayName}</Badge>
                      {lesson.student && (
                        <Badge ml={2} colorScheme="green">
                          Student: {lesson.student.displayName}
                        </Badge>
                      )}
                    </Box>

                    <Stack direction={{ base: "column", sm: "row" }} gap={3} mt={2}>
                      <NextLink href={`/lessons/${lesson.id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </NextLink>

                      {user.role === "student" && !lesson.student && (
                        <Button
                          colorScheme="purple"
                          size="sm"
                          onClick={() => handleJoinRequest(lesson.id)}
                          disabled={requestedLessons[lesson.id]}
                        >
                          {requestedLessons[lesson.id]
                            ? "Request Sent"
                            : "Request to Join"}
                        </Button>
                      )}

                      {(user.id === lesson.teacher.id || user.id === lesson.student?.id) && (
                        <NextLink href={`/lessons/${lesson.id}/live`}>
                          <Button colorScheme="green" size="sm">
                            {user.id === lesson.teacher.id ? "Start Lesson" : "Enter Room"}
                          </Button>
                        </NextLink>
                      )}
                    </Stack>
                  </Stack>
                </Card.Body>
              </Card.Root>
            ))}
          </Stack>
        )}
      </Box>
    </Stack>
  );
}
