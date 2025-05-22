'use client';

import { useRef, useState, useEffect } from 'react';
import { HiOutlineSpeakerWave, HiOutlineSpeakerXMark } from 'react-icons/hi2';

const AudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.3;
      audio.play().catch(() => {
        setIsPlaying(false);
      });
    }
  }, []);

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    setIsPlaying(!isPlaying);
  };

  return (
    <div className="mb-4 flex justify-center">
      <audio ref={audioRef} src="/somnia-vibes-music.mp3" loop />
      <button
        onClick={toggleAudio}
        className="text-xl text-dark-accent hover:text-yellow-400 transition"
        aria-label="Toggle Music"
      >
        {isPlaying ? <HiOutlineSpeakerWave /> : <HiOutlineSpeakerXMark />}
      </button>
    </div>
  );
};

export default AudioPlayer;
