"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  Field,
  Heading,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../../modules/auth/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "student" as "teacher" | "student",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(form);
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message || "Unable to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={10} px={4}>
      <Heading mb={6} textAlign="center">Create your free account</Heading>

      <Card.Root>
        <Card.Body>
          <form onSubmit={handleSubmit}>
            <Stack gap={5}>
              <Field.Root>
                <Field.Label>Full name</Field.Label>
                <Input
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  required
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Email</Field.Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Password</Field.Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Role</Field.Label>
                <Stack direction="row" gap={6}>
                  {(["teacher", "student"] as const).map((role) => (
                    <Box
                      key={role}
                      as="label"
                      display="flex"
                      alignItems="center"
                      cursor="pointer"
                      px={5}
                      py={3}
                      rounded="lg"
                      border="2px solid"
                      borderColor={form.role === role ? "purple.500" : "gray.200"}
                      bg={form.role === role ? "purple.50" : "white"}
                      _hover={{ borderColor: "purple.400" }}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={form.role === role}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                        style={{ marginRight: "10px" }}
                      />
                      <Text fontWeight="medium" textTransform="capitalize">
                        {role}
                      </Text>
                    </Box>
                  ))}
                </Stack>
              </Field.Root>

              {error && (
                <Alert.Root status="error">
                  <Alert.Content>
                    <Alert.Description>{error}</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              )}

              <Button type="submit" colorScheme="purple" size="lg" loading={loading}>
                Create account
              </Button>

              <a href="/login" style={{ textAlign: "center", display: "block", color: "#6B46C1" }}>
                Already have an account? Sign in
              </a>
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}