import { useEffect, useRef, useState } from "react";
import { CircleTip } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { tw } from "@biqpod/app/ui/utils";
type Props = {
  src: string;
  name?: string;
  className?: string;
};
const formatTime = (s: number) => {
  if (!isFinite(s)) return "00:00";
  const m = Math.floor(s / 60)
    .toString()
    .padStart(2, "0");
  const sec = Math.floor(s % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${sec}`;
};
const MediaAudioPlayer: React.FC<Props> = ({ src, className }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onEnded = () => setPlaying(false);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [src]);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => setPlaying(false));
      const tick = () => {
        setCurrent(audio.currentTime || 0);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      audio.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);
  const onToggle = () => setPlaying((p) => !p);
  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = val;
    setCurrent(val);
  };
  return (
    <div
      className={tw(
        "flex bg-[--biqpod-primary-background] border border-solid border-[--biqpod-borders] flex-col rounded-full p-3 gap-2 w-full",
        className
      )}
    >
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <div className="flex items-center gap-3">
        <CircleTip
          onClick={onToggle}
          className="bg-[--biqpod-secondary-background] hover:bg-[--biqpod-secondary-background] p-2 rounded-full"
          aria-label={playing ? "Pause" : "Play"}
          icon={playing ? allIcons.solid.faPause : allIcons.solid.faPlay}
        />
        <div className="relative flex-1">
          <input
            type="range"
            min={0}
            max={Math.max(0, duration)}
            step={0.01}
            value={current}
            onChange={onSeek}
            className="w-full"
          />
          <div className="top-[80%] absolute inset-x-3 flex justify-between text-[--biqpod-gray-opacity-2] mt-1 text-xs">
            <div>{formatTime(current)}</div>
            <div>{formatTime(duration)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MediaAudioPlayer;
