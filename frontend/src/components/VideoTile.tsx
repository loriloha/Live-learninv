"use client";

import { Box, Text } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

type Props = {
  stream: MediaStream | null;
  label: string;
  muted?: boolean;
};

export function VideoTile({ stream, label, muted }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Box bg="black" rounded="md" overflow="hidden" position="relative">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <Text
        position="absolute"
        bottom="2"
        left="2"
        px="2"
        py="1"
        bg="blackAlpha.600"
        color="white"
        fontSize="sm"
        rounded="md"
      >
        {label}
      </Text>
    </Box>
  );
}

