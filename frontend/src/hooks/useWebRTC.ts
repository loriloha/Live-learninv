// src/hooks/useWebRTC.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SimplePeer, { Instance as PeerInstance, SignalData } from "simple-peer";
import { io, Socket } from "socket.io-client";
import { API_BASE } from "../lib/api-client";

interface RemoteStream {
  socketId: string;
  stream: MediaStream;
  displayName?: string;
}

interface ChatMessage {
  message: string;
  senderName: string;
  senderId: string;
  sentAt: string | number;
}

export function useWebRTC(lessonId: string, displayName: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Record<string, PeerInstance>>({});

  // Get camera & mic
  useEffect(() => {
    let mounted = true;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (mounted) setLocalStream(stream);
      })
      .catch(() => console.log("Camera/mic blocked"));

    return () => {
      mounted = false;
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Cleanup refs
  const removePeer = useCallback((socketId: string) => {
    peersRef.current[socketId]?.destroy();
    delete peersRef.current[socketId];
    setRemoteStreams((prev) => prev.filter((s) => s.socketId !== socketId));
  }, []);

  const createPeer = useCallback(
    (remoteSocketId: string, initiator: boolean): PeerInstance => {
      if (peersRef.current[remoteSocketId]) {
        return peersRef.current[remoteSocketId];
      }

      const peer = new SimplePeer({
        initiator,
        stream: localStream!,
        trickle: true,
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
          { socketId: remoteSocketId, stream },
        ]);
      });

      peer.on("close", () => removePeer(remoteSocketId));
      peer.on("error", () => removePeer(remoteSocketId));

      peersRef.current[remoteSocketId] = peer;
      return peer;
    },
    [localStream, removePeer]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !socketRef.current) return;

      const msg: ChatMessage = {
        message: text.trim(),
        senderName: displayName,
        senderId: socketRef.current.id || "unknown",
        sentAt: new Date().toISOString(),
      };

      socketRef.current.emit("chat-message", msg);
      setMessages((prev) => [...prev, msg]);
    },
    [displayName]
  );

  // Main socket connection
  useEffect(() => {
    if (!lessonId || !localStream) return;

    const socket = io(`${API_BASE}/live`, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", { lessonId, displayName });
    });

    socket.on("peer-joined", ({ socketId }: { socketId: string }) => {
      createPeer(socketId, true);
    });

    socket.on("peer-left", ({ socketId }: { socketId: string }) => {
      removePeer(socketId);
    });

    socket.on("signal", ({ from, signal }: { from: string; signal: SignalData }) => {
      const peer = peersRef.current[from] || createPeer(from, false);
      peer.signal(signal);
    });

    socket.on("chat-message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      Object.values(peersRef.current).forEach((p) => p.destroy());
      peersRef.current = {};
      socket.disconnect();
    };
  }, [lessonId, localStream, displayName, createPeer, removePeer]);

  return {
    localStream,
    remoteStreams,
    messages,
    sendMessage,
  };
}