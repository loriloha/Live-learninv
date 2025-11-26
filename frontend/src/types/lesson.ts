export type Lesson = {
  id: string;
  topic: string;
  description?: string;
  scheduledAt: string;
  status: "scheduled" | "live" | "completed";
  teacher: {
    id: string;
    displayName: string;
  };
  student?: {
    id: string;
    displayName: string;
  } | null;
};

