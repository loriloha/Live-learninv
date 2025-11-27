// src/components/VideoTile.tsx
import { Box, Text, Flex } from "@chakra-ui/react";
import { useEffect, useRef } from "react";

// You will need to import your MicOffIcon and CameraOffIcon here if you have them,
// but for now, the status is displayed as red text.

interface Props {
  stream: MediaStream;
  label: string;
  muted?: boolean;
  isLocal?: boolean;
  // FIX: Added missing props for mute/camera status
  isMuted?: boolean;
  isCameraOff?: boolean;
}

export function VideoTile({
  stream,
  label,
  muted = false,
  isLocal = false,
  isMuted = false, // Default to not muted
  isCameraOff = false, // Default to camera on
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }

    // FIX: Toggle tracks for the local user to actually mute/turn off video data.
    if (isLocal) {
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];

      if (audioTrack) {
        audioTrack.enabled = !isMuted;
      }
      if (videoTrack) {
        videoTrack.enabled = !isCameraOff;
      }
    }
  }, [stream, isLocal, isMuted, isCameraOff]); // Re-run effect when status changes

  const hasVideo = stream.getVideoTracks().length > 0 && !isCameraOff;
  const showFallback = !hasVideo;

  return (
    <Box
      position="relative"
      rounded="2xl"
      overflow="hidden"
      boxShadow="2xl"
      bg="black"
      border={isLocal ? "5px solid" : "none"}
      borderColor="purple.500"
      // Added height to ensure the tile fills its container, fixing potential layout issues
      h="100%" 
    >
      {/* Only show video element if video is available and camera is not explicitly off */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={muted}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: isLocal ? "scaleX(-1)" : "none", // Mirror local video
          // Hide video if the camera is off or not available
          display: showFallback ? "none" : "block", 
        }}
      />
      
      {/* Fallback UI when camera is off */}
      {showFallback && (
        <Flex w="100%" h="100%" align="center" justify="center">
          <Text color="white" fontSize="xl">{label}: No Camera</Text>
        </Flex>
      )}

      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        bgGradient="linear(to-t, blackAlpha.800, transparent)"
        color="white"
        p={4}
        display="flex"
        justifyContent="space-between"
        alignItems="flex-end"
      >
        <Text fontWeight="bold" fontSize="lg">
          {label}
          {isLocal && " (You)"}
        </Text>
        
        {/* Status Indicators */}
        <Flex gap={2} alignItems="center">
            {isMuted && (
                <Text fontSize="sm" color="red.400" fontWeight="bold">MIC OFF</Text>
            )}
            {isCameraOff && (
                <Text fontSize="sm" color="red.400" fontWeight="bold">CAM OFF</Text>
            )}
        </Flex>

      </Box>
    </Box>
  );
}