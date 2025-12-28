import { useEffect, useRef, useState } from "react";
import { CircleTip } from "@biqpod/app/ui/components";
import { allIcons } from "@biqpod/app/ui/apis";
import { tw } from "@biqpod/app/ui/utils";
type Props = {
  src: string;
  name?: string;
  poster?: string;
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
const MediaVideoPlayer: React.FC<Props> = ({ src, poster, className }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLoaded = () => setDuration(video.duration || 0);
    const onEnded = () => setPlaying(false);
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("ended", onEnded);
    };
  }, [src]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.play().catch(() => setPlaying(false));
      const tick = () => {
        setCurrent(video.currentTime || 0);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } else {
      video.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);
  useEffect(() => {
    let hideTimer: number | undefined;
    const onMove = () => {
      setShowControls(true);
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setShowControls(false), 2000);
    };
    const cont = containerRef.current;
    cont?.addEventListener("mousemove", onMove);
    onMove();
    return () => {
      cont?.removeEventListener("mousemove", onMove);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);
  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && document.activeElement === document.body) {
        e.preventDefault();
        setPlaying((p) => !p);
      }
      if (e.key === "ArrowLeft") {
        if (videoRef.current)
          videoRef.current.currentTime = Math.max(
            0,
            (videoRef.current.currentTime || 0) - 5
          );
      }
      if (e.key === "ArrowRight") {
        if (videoRef.current)
          videoRef.current.currentTime = Math.min(
            videoRef.current.duration || 0,
            (videoRef.current.currentTime || 0) + 5
          );
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const toggleFull = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen?.();
    }
  };
  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = val;
    setCurrent(val);
  };
  return (
    <div
      ref={containerRef}
      className={tw(
        "relative w-full flex flex-col rounded-2xl border border-solid border-[--biqpod-borders] gap-2 overflow-hidden",
        className
      )}
    >
      <div className="flex justify-center items-center h-full">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="bg-[--biqpod-primary-background] rounded-lg max-h-[50vh]"
          playsInline
        />
      </div>
      {/* overlay big play button */}
      {!playing && (
        <div className="absolute inset-0 flex justify-center items-center">
          <CircleTip
            aria-label="Play"
            onClick={() => setPlaying(true)}
            className="bg-black bg-opacity-40 m-auto rounded-full w-20 h-20 text-white"
            icon={allIcons.solid.faPlay}
          />
        </div>
      )}
      {/* controls */}
      <div
        className={tw(
          `p-2 rounded-md absolute bottom-0 inset-x-0 bg-black bg-opacity-40 transition-opacity`,
          !showControls && "opacity-100"
        )}
      >
        <div className="flex items-center gap-2">
          <div>
            <CircleTip
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause" : "Play"}
              icon={playing ? allIcons.solid.faPause : allIcons.solid.faPlay}
            />
          </div>
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
            <div className="top-[80%] absolute inset-3 flex justify-between text-[--biqpod-gray-opacity-2] mt-1 text-xs">
              <div>{formatTime(current)}</div>
              <div>{formatTime(duration)}</div>
            </div>
          </div>
          <div>
            <CircleTip onClick={toggleFull} icon={allIcons.solid.faExpand} />
          </div>
        </div>
      </div>
    </div>
  );
};
export { MediaVideoPlayer };
