// src/components/VideoTile.tsx
import { Box, Text } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

interface Props {
  stream: MediaStream;
  label: string;
  muted?: boolean;
  isLocal?: boolean;
}

export function VideoTile({ stream, label, muted = false, isLocal = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Box
      position="relative"
      rounded="2xl"
      overflow="hidden"
      boxShadow="2xl"
      bg="black"
      border={isLocal ? "5px solid" : "none"}
      borderColor="purple.500"
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{
          width: "100%",
          height: "auto",
          maxHeight: "560px",
          objectFit: "cover",
          transform: isLocal ? "scaleX(-1)" : "none", // Mirror local video
        }}
      />

      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        bgGradient="linear(to-t, blackAlpha.800, transparent)"
        color="white"
        p={4}
      >
        <Text fontWeight="bold" fontSize="lg">
          {label}
          {isLocal && " (You)"}
        </Text>
      </Box>
    </Box>
  );
}