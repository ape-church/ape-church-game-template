"use client";

import React, { useEffect, useState } from "react";

interface SpriteAnimationProps {
  alt: string;
  frames: readonly string[];
  className?: string;
  fps?: number;
  loop?: boolean;
  play?: boolean;
  restartKey?: string | number;
}

const SpriteAnimation: React.FC<SpriteAnimationProps> = ({
  alt,
  frames,
  className,
  fps = 12,
  loop = true,
  play = true,
  restartKey,
}) => {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    setFrameIndex(0);
  }, [restartKey, frames]);

  useEffect(() => {
    if (!play || frames.length <= 1) {
      return undefined;
    }

    const intervalMs = Math.max(16, Math.floor(1000 / fps));
    const intervalId = window.setInterval(() => {
      setFrameIndex((previous) => {
        if (loop) {
          return (previous + 1) % frames.length;
        }

        return previous >= frames.length - 1 ? previous : previous + 1;
      });
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [fps, frames.length, loop, play, restartKey]);

  return (
    <img
      src={frames[Math.min(frameIndex, frames.length - 1)]}
      alt={alt}
      className={className}
      draggable={false}
    />
  );
};

export default SpriteAnimation;
