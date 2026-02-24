"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./VideoPlayer.module.css";

interface PlayerCommand {
  type: "play" | "pause" | "stop" | "setVolume" | "seek" | "setLoop" | "setMute" | "setSpeed" | "setAspect";
  payload?: unknown;
}

interface PlayerStateInfo {
  state: "stopped" | "playing" | "paused";
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
}

interface Props {
  url: string;
  command: PlayerCommand | null;
  aspectRatio?: string;
  onStateChange?: (state: PlayerStateInfo) => void;
}

const ASPECT_RATIO_MAP: Record<string, string> = {
  auto: "auto",
  "1:1": "1 / 1",
  "5:4": "5 / 4",
  "4:3": "4 / 3",
  "16:9": "16 / 9",
  "16:10": "16 / 10",
  fill: "auto",
  expanding: "auto",
};

export default function VideoPlayer({ url, command, aspectRatio = "auto", onStateChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<"stopped" | "playing" | "paused">("stopped");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentAspect, setCurrentAspect] = useState(aspectRatio);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setState("playing");
    const onPause = () => setState("paused");
    const onEnded = () => setState("stopped");
    const onTimeUpdate = () => setPosition(Math.floor(video.currentTime * 1000));
    const onDurationChange = () => setDuration(Math.floor((video.duration || 0) * 1000));
    const onVolumeChange = () => {
      setVolume(Math.round(video.volume * 100));
      setMuted(video.muted);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("volumechange", onVolumeChange);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("volumechange", onVolumeChange);
    };
  }, []);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({ state, position, duration, volume, muted });
    }
  }, [state, position, duration, volume, muted, onStateChange]);

  useEffect(() => {
    if (!command) return;
    const video = videoRef.current;
    if (!video) return;

    switch (command.type) {
      case "play": {
        const p = command.payload as { url?: string } | undefined;
        if (p?.url) {
          video.src = p.url;
          video.load();
        }
        video.play().catch(() => {});
        break;
      }
      case "pause":
        video.pause();
        break;
      case "stop":
        video.pause();
        video.currentTime = 0;
        video.src = "";
        setState("stopped");
        break;
      case "setVolume": {
        const v = (command.payload as { volume: number }).volume;
        video.volume = v / 100;
        setVolume(v);
        break;
      }
      case "setMute": {
        const m = (command.payload as { muted: boolean }).muted;
        video.muted = m;
        setMuted(m);
        break;
      }
      case "seek": {
        const pos = (command.payload as { position: number }).position;
        video.currentTime = pos / 1000;
        break;
      }
      case "setLoop": {
        const loop = (command.payload as { loop: number }).loop;
        video.loop = loop !== 0;
        break;
      }
      case "setSpeed": {
        const speed = (command.payload as { speed: number }).speed;
        video.playbackRate = speed;
        break;
      }
      case "setAspect": {
        const aspect = (command.payload as { aspect: string }).aspect;
        setCurrentAspect(aspect);
        break;
      }
    }
  }, [command]);

  const formatTime = (ms: number) => {
    const total = Math.floor(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !progressRef.current || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = ratio * (duration / 1000);
  };

  const cssAspect = currentAspect === "fill"
    ? undefined
    : (ASPECT_RATIO_MAP[currentAspect] ?? "auto");

  const videoStyle = currentAspect === "fill"
    ? { width: "100%", height: "100%", objectFit: "fill" as const }
    : { aspectRatio: cssAspect };

  return (
    <div className={styles.playerContainer}>
      <video
        ref={videoRef}
        id="yasem-player"
        className={styles.video}
        style={videoStyle}
        controls={false}
        playsInline
        src={url}
      />

      {state !== "stopped" && (
        <div className={styles.controls}>
          <div
            ref={progressRef}
            className={styles.progressBar}
            onClick={handleProgressClick}
            title="Click to seek"
          >
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className={styles.controlsRow}>
            <div className={styles.leftControls}>
              <button
                className={styles.ctrlBtn}
                onClick={() => {
                  const video = videoRef.current;
                  if (!video) return;
                  if (video.paused) video.play().catch(() => {});
                  else video.pause();
                }}
              >
                {state === "playing" ? "⏸" : "▶"}
              </button>
              <button
                className={styles.ctrlBtn}
                onClick={() => {
                  const video = videoRef.current;
                  if (!video) return;
                  video.pause();
                  video.currentTime = 0;
                  video.src = "";
                  setState("stopped");
                }}
              >
                ⏹
              </button>
              <span className={styles.time}>
                {formatTime(position)} / {formatTime(duration)}
              </span>
            </div>
            <div className={styles.rightControls}>
              <button
                className={styles.muteBtn}
                onClick={() => {
                  const video = videoRef.current;
                  if (video) {
                    video.muted = !video.muted;
                    setMuted(video.muted);
                  }
                }}
              >
                {muted ? "🔇" : "🔊"}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                className={styles.volumeSlider}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVolume(val);
                  const video = videoRef.current;
                  if (video) video.volume = val / 100;
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
