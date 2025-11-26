"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SimplePeer, { Instance as PeerInstance, SignalData } from "simple-peer";
import { io, Socket } from "socket.io-client";
import { API_BASE } from "../lib/api-client";

type RemoteStream = {
  socketId: string;
  stream: MediaStream;
  displayName?: string;
};

type ChatMessage = {
  senderName: string;
  message: string;
  sentAt: string;
};

export function useWebRTC(lessonId: string, displayName: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<RemoteStream[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket>();
  const peersRef = useRef<Record<string, PeerInstance>>({});

  useEffect(() => {
    let isMounted = true;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (isMounted) {
          setLocalStream(stream);
        }
      })
      .catch((err) => console.error("Media error", err));
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!lessonId || !localStream) {
      return;
    }
    const socket = io(`${API_BASE}/live`, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", { lessonId, displayName });
    });

    socket.on("peer-joined", ({ socketId }) => {
      createPeer(socketId, true);
    });

    socket.on("peer-left", ({ socketId }) => {
      removePeer(socketId);
    });

    const handleSignal = (payload: { from: string; signal: SignalData }) => {
      const peer = createPeer(payload.from, false);
      peer.signal(payload.signal);
    };

    socket.on("signal-offer", handleSignal);
    socket.on("signal-answer", handleSignal);
    socket.on("signal-ice", handleSignal);

    socket.on("chat-message", (payload: ChatMessage) => {
      setMessages((prev) => [...prev, payload]);
    });

    return () => {
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      peersRef.current = {};
      socket.disconnect();
      localStream.getTracks().forEach((track) => track.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, localStream, displayName]);

  const removePeer = useCallback((socketId: string) => {
    const peer = peersRef.current[socketId];
    if (peer) {
      peer.destroy();
      delete peersRef.current[socketId];
    }
    setRemoteStreams((prev) => prev.filter((s) => s.socketId !== socketId));
  }, []);

  const createPeer = useCallback(
    (remoteSocketId: string, initiator: boolean) => {
      if (!localStream) {
        throw new Error("Local stream missing");
      }
      if (peersRef.current[remoteSocketId]) {
        return peersRef.current[remoteSocketId];
      }
      const peer = new SimplePeer({
        initiator,
        stream: localStream,
        trickle: true,
      });

      peer.on("signal", (signal) => {
        const socket = socketRef.current;
        if (!socket) return;
        const event =
          signal.type === "offer"
            ? "signal-offer"
            : signal.type === "answer"
            ? "signal-answer"
            : "signal-ice";
        socket.emit(event, {
          lessonId,
          signal,
          targetSocketId: remoteSocketId,
        });
      });

      peer.on("stream", (stream) => {
        setRemoteStreams((prev) => [
          ...prev.filter((s) => s.socketId !== remoteSocketId),
          { socketId: remoteSocketId, stream },
        ]);
      });

      peer.on("close", () => removePeer(remoteSocketId));
      peer.on("error", (err) => {
        console.error(err);
        removePeer(remoteSocketId);
      });

      peersRef.current[remoteSocketId] = peer;
      return peer;
    },
    [lessonId, localStream, removePeer]
  );

  const sendMessage = useCallback(
    (message: string) => {
      if (!message.trim()) return;
      socketRef.current?.emit("chat-message", {
        lessonId,
        message,
        senderName: displayName,
      });
    },
    [lessonId, displayName]
  );

  return {
    localStream,
    remoteStreams,
    messages,
    sendMessage,
  };
}

