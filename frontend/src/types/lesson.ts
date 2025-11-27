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

export type LessonRequest = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  student: {
    id: string;
    displayName: string;
    email?: string;
  };
  createdAt: string;
  updatedAt: string;
};


// Add this new type — required by useWebRTC hook and live page
export interface ChatMessage {
  message: string;
  senderName: string;
  senderId: string;        // This was missing → caused the error
  sentAt: string | number; // Can be ISO string or timestamp
}

// Optional: useful for WebRTC peer info
export interface PeerStream {
  socketId: string;
  stream: MediaStream;
  displayName?: string;
}
