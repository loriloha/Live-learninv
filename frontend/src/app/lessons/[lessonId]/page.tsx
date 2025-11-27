"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Heading,
  // Select, // <-- REMOVED: Causing JSX component error
  Stack,
  Text,
  Field, // <-- Added Field for the select input
} from "@chakra-ui/react";
import { useToast } from "@chakra-ui/toast";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { apiFetch } from "../../../lib/api-client";
import { Lesson, LessonRequest } from "../../../types/lesson";
import type { PublicUser } from "../../../types/user";
import { useProtectedRoute } from "../../../hooks/useProtectedRoute";
import { useAuth } from "../../../modules/auth/AuthContext";

export default function LessonDetailsPage() {
  const params = useParams<{ lessonId: string }>();
  const router = useRouter();
  const { user } = useProtectedRoute();
  const { token } = useAuth();
  const toast = useToast();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [students, setStudents] = useState<PublicUser[]>([]);
  const [assignmentStudentId, setAssignmentStudentId] = useState("");
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [respondingRequest, setRespondingRequest] = useState<{
    id: string;
    action: "accepted" | "rejected";
  } | null>(null);
  const [myRequest, setMyRequest] = useState<LessonRequest | null>(null);
  const [requesting, setRequesting] = useState(false);
  // FIX 1: Added missing 'joining' state
  const [joining, setJoining] = useState(false);
  
  const pendingRequests = useMemo(
    () => requests.filter((req) => req.status === "pending"),
    [requests]
  );

  const fetchLesson = useCallback(async () => {
    if (!token || !params.lessonId) return;

    try {
      const data = await apiFetch<Lesson>(`/lessons/${params.lessonId}`, { token });
      setLesson(data);
      setAssignmentStudentId(data.student?.id ?? "");
    } catch {
      toast({ title: "Lesson not found", status: "error" });
      router.push("/dashboard");
    }
  }, [params.lessonId, token, toast, router]);

  const loadStudents = useCallback(async () => {
    if (!token || user?.role !== "teacher") return;
    try {
      const data = await apiFetch<PublicUser[]>("/users?role=student", { token });
      setStudents(data);
    } catch {
      setStudents([]);
    }
  }, [token, user?.role]);

  const loadRequests = useCallback(async () => {
    if (!token || !params.lessonId || !lesson || user?.id !== lesson.teacher.id) {
      return;
    }
    setRequestsLoading(true);
    try {
      const data = await apiFetch<LessonRequest[]>(
        `/lessons/${params.lessonId}/requests`,
        { token }
      );
      setRequests(data);
    } catch {
      setRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  }, [lesson, params.lessonId, token, user?.id]);

  const loadMyRequest = useCallback(async () => {
    if (!token || !params.lessonId || user?.role !== "student") return;
    try {
      const data = await apiFetch<LessonRequest[]>(
        `/lessons/${params.lessonId}/requests?scope=mine`,
        { token }
      );
      setMyRequest(data[0] ?? null);
    } catch {
      setMyRequest(null);
    }
  }, [params.lessonId, token, user?.role]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  useEffect(() => {
    if (!lesson || !user) return;
    if (user.id === lesson.teacher.id) {
      loadStudents();
      loadRequests();
    } else if (user.role === "student") {
      loadMyRequest();
    }
  }, [lesson, user, loadRequests, loadMyRequest, loadStudents]);

  const handleAssignmentUpdate = async (targetStudentId: string | null) => {
    if (!token || !lesson) return;
    setAssignmentSaving(true);
    try {
      const body = targetStudentId
        ? { studentId: targetStudentId }
        : { unassign: true };
      const updated = await apiFetch<Lesson>(`/lessons/${lesson.id}/assignment`, {
        method: "PATCH",
        token,
        body: JSON.stringify(body),
      });
      setLesson(updated);
      setAssignmentStudentId(updated.student?.id ?? "");
      toast({
        title: targetStudentId ? "Student assigned" : "Student removed",
        status: "success",
      });
      await loadRequests();
    } catch {
      toast({
        title: "Unable to update assignment",
        status: "error",
      });
    } finally {
      setAssignmentSaving(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!token || !params.lessonId) return;
    setRequesting(true);
    try {
      const request = await apiFetch<LessonRequest>(
        `/lessons/${params.lessonId}/requests`,
        { method: "POST", token }
      );
      setMyRequest(request);
      toast({
        title:
          request.status === "accepted"
            ? "You have been added to this lesson"
            : "Request sent",
        status: "success",
      });
      if (request.status === "accepted") {
        fetchLesson();
      }
    } catch {
      toast({ title: "Failed to send request", status: "error" });
    } finally {
      setRequesting(false);
    }
  };

  const handleRespond = async (
    requestId: string,
    action: "accepted" | "rejected"
  ) => {
    if (!token || !lesson) return;
    setRespondingRequest({ id: requestId, action });
    try {
      await apiFetch<LessonRequest>(
        `/lessons/${lesson.id}/requests/${requestId}`,
        {
          method: "PATCH",
          token,
          body: JSON.stringify({ status: action }),
        }
      );
      toast({
        title: action === "accepted" ? "Request accepted" : "Request rejected",
        status: "success",
      });
      await fetchLesson();
      await loadRequests();
    } catch {
      toast({ title: "Unable to update request", status: "error" });
    } finally {
      setRespondingRequest(null);
    }
  };

  const handleJoin = async () => {
    if (!token || !params.lessonId || lesson?.student) return;

    setJoining(true); // FIX 1: setJoining now exists
    try {
      const updated = await apiFetch<Lesson>(`/lessons/${params.lessonId}/join`, {
        method: "POST",
        token,
      });
      setLesson(updated);
      toast({ title: "Successfully joined!", status: "success" });
    } catch { // FIX: Removed unused 'err' parameter
      toast({ title: "Failed to join", status: "error" });
    } finally {
      setJoining(false); // FIX 1: setJoining now exists
    }
  };

  if (!lesson || !user) {
    return <Text textAlign="center" mt={20}>Loading lesson details...</Text>;
  }

  const isTeacher = user.id === lesson.teacher.id;
  const isParticipant = isTeacher || user.id === lesson.student?.id;
  const canRequestJoin = user.role === "student" && !lesson.student;
  const requestLabel =
    myRequest?.status === "pending"
      ? "Request Pending"
      : myRequest?.status === "accepted"
      ? "Approved"
      : "Request to Join";
  const requestDisabled =
    requesting || myRequest?.status === "pending" || myRequest?.status === "accepted";
  const requestHelperText =
    myRequest?.status === "pending"
      ? "Waiting for the teacher to respond."
      : myRequest?.status === "rejected"
      ? "Your previous request was rejected. You can send another."
      : null;
  const assignmentChanged =
    assignmentStudentId !== (lesson.student?.id ?? "") && assignmentStudentId !== "";

  return (
    <Stack gap={6} maxW="4xl" mx="auto" mt={10}>
      <Card.Root shadow="xl">
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

              {canRequestJoin && (
                <Button
                  colorScheme="purple"
                  onClick={handleRequestJoin}
                  loading={requesting}
                  disabled={requestDisabled}
                >
                  {requestLabel}
                </Button>
              )}

              {isParticipant && (
                <Button
                  colorScheme="green"
                  size="lg"
                  onClick={() => router.push(`/lessons/${lesson.id}/live`)}
                >
                  {isTeacher ? "Start Lesson" : "Enter Live Room"}
                </Button>
              )}
            </Stack>

            {requestHelperText && canRequestJoin && (
              <Text fontSize="sm" color="gray.600">
                {requestHelperText}
              </Text>
            )}
          </Stack>
        </Card.Body>
      </Card.Root>

      {isTeacher && (
        <>
          <Card.Root>
            <Card.Body>
              <Stack gap={4}>
                <Heading size="md">Assign a Student</Heading>
                <Field.Root>
                  <Field.Label htmlFor="assignmentStudentId">Assign a Student</Field.Label>
                  {/* FIX: Used native <select> instead of problematic Chakra Select */}
                  <select
                    id="assignmentStudentId"
                    style={{
                      width: '100%', 
                      padding: '8px 12px', 
                      borderRadius: 'var(--chakra-radii-md)', 
                      border: '1px solid var(--chakra-colors-gray-200)',
                      appearance: 'none', 
                      backgroundColor: 'var(--chakra-colors-white)',
                      height: 'var(--chakra-sizes-10)',
                    }}
                    value={assignmentStudentId}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => // FIX: Explicitly typed 'e'
                      setAssignmentStudentId(e.target.value)
                    }
                  >
                    <option value="">No student selected</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.displayName} ({student.email})
                      </option>
                    ))}
                  </select>
                </Field.Root>
                <Stack direction={{ base: "column", sm: "row" }} gap={3}>
                  <Button
                    colorScheme="purple"
                    onClick={() => handleAssignmentUpdate(assignmentStudentId || null)}
                    loading={assignmentSaving}
                    disabled={!assignmentStudentId || !assignmentChanged}
                  >
                    Assign Student
                  </Button>
                  <Button
                    variant="outline"
                    colorScheme="gray"
                    onClick={() => handleAssignmentUpdate(null)}
                    loading={assignmentSaving}
                    disabled={!lesson.student}
                  >
                    Remove Student
                  </Button>
                </Stack>
              </Stack>
            </Card.Body>
          </Card.Root>

          <Card.Root>
            <Card.Body>
              <Stack gap={4}>
                <Heading size="md">
                  Join Requests {pendingRequests.length > 0 && `(${pendingRequests.length} pending)`}
                </Heading>
                {requestsLoading ? (
                  <Text color="gray.500">Loading requests...</Text>
                ) : requests.length === 0 ? (
                  <Text color="gray.500">No requests yet.</Text>
                ) : (
                  requests.map((request) => (
                    <Box
                      key={request.id}
                      borderWidth="1px"
                      borderRadius="lg"
                      p={4}
                      display="flex"
                      justifyContent="space-between"
                      alignItems={{ base: "flex-start", md: "center" }}
                      flexDirection={{ base: "column", md: "row" }}
                      gap={3}
                    >
                      <Stack gap={1}>
                        <Text fontWeight="bold">{request.student.displayName}</Text>
                        <Text fontSize="sm" color="gray.500">
                          Requested {dayjs(request.createdAt).format("MMM D, YYYY h:mm A")}
                        </Text>
                        <Badge
                          colorScheme={
                            request.status === "pending"
                              ? "orange"
                              : request.status === "accepted"
                              ? "green"
                              : "red"
                          }
                          width="fit-content"
                        >
                          {request.status.toUpperCase()}
                        </Badge>
                      </Stack>

                      {request.status === "pending" && (
                        <Stack direction="row" gap={2}>
                          <Button
                            size="sm"
                            colorScheme="green"
                            onClick={() => handleRespond(request.id, "accepted")}
                            loading={
                              respondingRequest?.id === request.id &&
                              respondingRequest?.action === "accepted"
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            colorScheme="red"
                            onClick={() => handleRespond(request.id, "rejected")}
                            loading={
                              respondingRequest?.id === request.id &&
                              respondingRequest?.action === "rejected"
                            }
                          >
                            Reject
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  ))
                )}
              </Stack>
            </Card.Body>
          </Card.Root>
        </>
      )}
    </Stack>
  );
}