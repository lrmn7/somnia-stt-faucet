import React, { useEffect, useRef } from 'react';

export interface GlobalBackgroundProps {
  videoSrc?: string;
  overlayOpacity?: number;
}

export const GlobalBackground: React.FC<GlobalBackgroundProps> = ({
  videoSrc = '/bg.mp4',
  overlayOpacity = 35,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;

    const playVideo = () => {
      video.play().catch((err) => {
        console.warn('[GlobalBackground] Autoplay blocked, waiting for interaction:', err);
      });
    };

    playVideo();

    const handleInteraction = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [videoSrc]);

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      style={{ width: '100vw', height: '100vh' }}
      aria-hidden="true"
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        src={videoSrc}
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 z-[1] transition-opacity duration-300"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${overlayOpacity / 100})`,
        }}
      />
    </div>
  );
};
