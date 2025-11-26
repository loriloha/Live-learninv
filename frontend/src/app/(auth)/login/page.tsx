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
} from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../../../modules/auth/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(form);
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={10} px={4}>
      <Heading mb={6} textAlign="center">Log in</Heading>

      <Card.Root>
        <Card.Body>
          <form onSubmit={handleSubmit}>
            <Stack gap={5}>
              <Field.Root>
                <Field.Label>Email</Field.Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </Field.Root>

              <Field.Root>
                <Field.Label>Password</Field.Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              </Field.Root>

              {error && (
                <Alert.Root status="error">
                  <Alert.Content>
                    <Alert.Description>{error}</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              )}

              <Button type="submit" colorScheme="purple" size="lg" loading={loading}>
                Log in
              </Button>
        <a href="/register" style={{ textAlign: "center", display: "block", color: "#6B46C1" }}>
               
                Need an account? Register
              </a>
              
            </Stack>
          </form>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}