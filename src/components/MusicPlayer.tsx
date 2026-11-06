import { useState, useEffect } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import { romanticAudio } from "../utils/audioSynth";

interface MusicPlayerProps {
  autoStart?: boolean;
}

export default function MusicPlayer({ autoStart = false }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (autoStart) {
      romanticAudio.start().then((started) => {
        setIsPlaying(started);
        if (started) {
          setShowTooltip(true);
          setTimeout(() => setShowTooltip(false), 4000);
        }
      });
    }

    return () => {
      // Keep playing or let user control
    };
  }, [autoStart]);

  const toggleMusic = () => {
    const nextState = romanticAudio.toggle();
    setIsPlaying(nextState);
  };

  return (
    <div className="floating-music-container">
      {showTooltip && (
        <div className="music-toast-hint">
          <span>♫ Đang phát giai điệu lãng mạn</span>
        </div>
      )}

      <button
        className={`floating-music-btn ${isPlaying ? "playing" : "paused"}`}
        onClick={toggleMusic}
        title={isPlaying ? "Tắt nhạc" : "Bật nhạc nền"}
        aria-label="Điều khiển âm nhạc"
      >
        <div className="disc-icon-wrapper">
          <Music size={18} className="music-note-icon" />
        </div>

        <div className="sound-wave-icon">
          {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </div>
      </button>
    </div>
  );
}
