import { useState } from "react";
import { Music, Volume2, VolumeX } from "lucide-react";
import { romanticAudio } from "../utils/audioSynth";

interface MusicPlayerProps {
  /**
   * Khi prop này chuyển từ false → true, trình phát sẽ bắt đầu.
   * QUAN TRỌNG: prop này phải được set trong cùng một synchronous
   * click-handler để iOS Safari cho phép phát audio tự động.
   */
  triggerStart?: boolean;
}

export default function MusicPlayer({ triggerStart }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [hasStartedOnce, setHasStartedOnce] = useState(false);

  // Được gọi bởi App khi người dùng nhấn "Mở thiệp" — CÙNG lúc với gesture
  // App truyền onStartAudio callback xuống thay vì dùng useEffect
  if (triggerStart && !hasStartedOnce) {
    setHasStartedOnce(true);
    // Gọi trực tiếp (synchronous path từ click) để iOS không block
    romanticAudio.start().then((started) => {
      setIsPlaying(started);
      if (started) {
        setShowTooltip(true);
        setTimeout(() => setShowTooltip(false), 4000);
      }
    });
  }

  const toggleMusic = () => {
    const nextState = romanticAudio.toggle();
    setIsPlaying(nextState);
  };

  return (
    <div className="floating-music-container">
      {showTooltip && (
        <div className="music-toast-hint">
          <span>♫ Đang phát nhạc nền</span>
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
