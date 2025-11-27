"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SimplePeer, { Instance as PeerInstance, SignalData } from "simple-peer";
import { io, Socket } from "socket.io-client";
import { API_BASE } from "../lib/api-client";

type Role = "teacher" | "student";

interface RemoteStream {
  socketId: string;
  stream: MediaStream;
  displayName?: string;
}

export interface ChatMessage {
  message: string;
  senderName: string;
  senderId: string;
  sentAt: string | number;
}

export type ParticipantBadge = {
  id: string;
  displayName: string;
  isLocal: boolean;
};

interface UseWebRTCOptions {
  lessonId: string;
  displayName: string;
  userId: string;
  role: Role;
}

export function useWebRTC({
  lessonId,
  displayName,
  userId,
  role,
}: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ParticipantBadge[]>([
    { id: "local", displayName, isLocal: true },
  ]);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [sessionEndedBy, setSessionEndedBy] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Record<string, PeerInstance>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const participantDirectory = useRef<
    Record<string, { socketId: string; displayName?: string; userId?: string }>
  >({});
  const syncMicState = useCallback(() => {
    const audioTracks = localStreamRef.current?.getAudioTracks() ?? [];
    if (!audioTracks.length) {
      setIsMicMuted(false);
      return;
    }
    setIsMicMuted(audioTracks.every((track) => !track.enabled));
  }, []);

  const syncCameraState = useCallback(() => {
    const videoTracks = localStreamRef.current?.getVideoTracks() ?? [];
    if (!videoTracks.length) {
      setIsCameraOff(false);
      return;
    }
    setIsCameraOff(videoTracks.every((track) => !track.enabled));
  }, []);

  const refreshParticipants = useCallback(() => {
    const remoteEntries = Object.values(participantDirectory.current).map(
      (participant) => ({
        id: participant.socketId,
        displayName: participant.displayName ?? "Participant",
        isLocal: false,
      })
    );

    setParticipants([
      { id: "local", displayName, isLocal: true },
      ...remoteEntries,
    ]);
  }, [displayName]);

  const cleanupConnections = useCallback((stopLocalTracks = false) => {
    Object.values(peersRef.current).forEach((peer) => peer.destroy());
    peersRef.current = {};
    setRemoteStreams([]);
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (stopLocalTracks && localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    participantDirectory.current = {};
    setParticipants([{ id: "local", displayName, isLocal: true }]);
  }, [displayName]);

  const removePeer = useCallback((socketId: string) => {
    peersRef.current[socketId]?.destroy();
    delete peersRef.current[socketId];
    delete participantDirectory.current[socketId];
    setRemoteStreams((prev) => prev.filter((s) => s.socketId !== socketId));
    refreshParticipants();
  }, [refreshParticipants]);

  const createPeer = useCallback(
    (remoteSocketId: string, initiator: boolean): PeerInstance => {
      const existing = peersRef.current[remoteSocketId];
      if (existing) {
        return existing;
      }

      // STUN servers are critical for PC-to-PC connections
      const peerConfig = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" }, // Added a fallback STUN
        ],
      };

      const peer = new SimplePeer({
        initiator,
        trickle: true,
        config: peerConfig,
        stream: localStreamRef.current ?? undefined,
      });

      peer.on("signal", (signal: SignalData) => {
        socketRef.current?.emit("signal", {
          targetSocketId: remoteSocketId,
          signal,
        });
      });

      peer.on("stream", (stream: MediaStream) => {
        setRemoteStreams((prev) => [
          ...prev.filter((s) => s.socketId !== remoteSocketId),
          {
            socketId: remoteSocketId,
            stream,
            displayName:
              participantDirectory.current[remoteSocketId]?.displayName ??
              "Participant",
          },
        ]);
      });

      peer.on("close", () => removePeer(remoteSocketId));
      peer.on("error", (err) => {
        console.error("Peer connection error:", err);
        removePeer(remoteSocketId);
      });

      peersRef.current[remoteSocketId] = peer;

      // Ensure stream is added if available
      if (localStreamRef.current) {
        try {
          peer.addStream(localStreamRef.current);
        } catch {
          // Stream might already be added
        }
      }

      return peer;
    },
    [removePeer]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !socketRef.current || !userId) return;

      socketRef.current.emit("chat-message", {
        message: text.trim(),
        senderName: displayName,
        senderId: userId,
      });
    },
    [displayName, userId]
  );

  const toggleMic = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTracks = localStreamRef.current.getAudioTracks();
    if (!audioTracks.length) return;

    const nextEnabled = !audioTracks[0].enabled;
    audioTracks.forEach((track) => {
      track.enabled = nextEnabled;
    });
    syncMicState();
  }, [syncMicState]);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTracks = localStreamRef.current.getVideoTracks();
    if (!videoTracks.length) return;

    const nextEnabled = !videoTracks[0].enabled;
    videoTracks.forEach((track) => {
      track.enabled = nextEnabled;
    });
    syncCameraState();
  }, [syncCameraState]);

  const leaveSession = useCallback(() => {
    cleanupConnections(true);
    setMessages([]);
    setSessionEndedBy(null);
  }, [cleanupConnections]);

  const notifySessionEnd = useCallback(() => {
    socketRef.current?.emit("end-session");
  }, []);

  // 1. Get User Media First
  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        syncMicState();
        syncCameraState();

        // Update any existing peers with the new stream
        Object.values(peersRef.current).forEach((peer) => {
          try {
            peer.addStream(stream);
          } catch {
            // ignore
          }
        });
      })
      .catch((err) => {
        console.error("Camera/mic blocked", err);
      });

    return () => {
      mounted = false;
      cleanupConnections(true);
    };
  }, [cleanupConnections, syncCameraState, syncMicState]);

  // 2. Connect Socket only after LocalStream is ready
  useEffect(() => {
    if (!lessonId || !userId || !localStream) return;

    const socket = io(`${API_BASE}/live`, {
      transports: ["websocket"],
      reconnectionAttempts: 5, // Improved reconnection logic
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", {
        lessonId,
        displayName,
        userId,
        role,
      });
    });

    socket.on(
      "existing-peers",
      (
        peers: Array<{
          socketId: string;
          displayName?: string;
          userId?: string;
        }>
      ) => {
        peers.forEach((peer) => {
          participantDirectory.current[peer.socketId] = peer;
          // CRITICAL CHANGE 1: New user (Joiner) does NOT initiate. 
          // They wait for the "stable" existing user to call them.
          createPeer(peer.socketId, false);
        });
        refreshParticipants();
      }
    );

    socket.on(
      "peer-joined",
      (peer: { socketId: string; displayName?: string; userId?: string }) => {
        participantDirectory.current[peer.socketId] = peer;
        // CRITICAL CHANGE 2: Existing user (Host) INITIATES the call.
        // This prevents collision and improves success rate on PCs.
        createPeer(peer.socketId, true);
        refreshParticipants();
      }
    );

    socket.on("peer-left", ({ socketId }: { socketId: string }) => {
      removePeer(socketId);
    });

    socket.on(
      "signal",
      ({ from, signal }: { from: string; signal: SignalData }) => {
        // If we receive a signal and don't have a peer, create a receiver (non-initiator)
        const peer = peersRef.current[from] || createPeer(from, false);
        peer?.signal(signal);
      }
    );

    socket.on("chat-message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("session-ended", ({ endedBy }: { endedBy?: string }) => {
      setSessionEndedBy(endedBy ?? "Host");
      cleanupConnections(true);
    });

    return () => {
      socket.off();
      cleanupConnections();
    };
  }, [
    lessonId,
    displayName,
    userId,
    role,
    localStream, // Socket connects after stream is ready
    createPeer,
    removePeer,
    refreshParticipants,
    cleanupConnections,
  ]);

  return {
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
  };
}