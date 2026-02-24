"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./VideoPlayer.module.css";

interface PlayerCommand {
  type: "play" | "pause" | "stop" | "setVolume" | "seek" | "setLoop" | "setMute";
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
  onStateChange?: (state: PlayerStateInfo) => void;
}

export default function VideoPlayer({ url, command, onStateChange }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [state, setState] = useState<"stopped" | "playing" | "paused">("stopped");
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setState("playing");
    const onPause = () => setState("paused");
    const onEnded = () => setState("stopped");
    const onTimeUpdate = () => {
      setPosition(Math.floor(video.currentTime * 1000));
    };
    const onDurationChange = () => {
      setDuration(Math.floor((video.duration || 0) * 1000));
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
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

  return (
    <div className={styles.playerContainer}>
      <video
        ref={videoRef}
        id="yasem-player"
        className={styles.video}
        controls={false}
        playsInline
        src={url}
      />

      {state !== "stopped" && (
        <div className={styles.controls}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className={styles.controlsRow}>
            <span className={styles.time}>
              {formatTime(position)} / {formatTime(duration)}
            </span>
            <div className={styles.volumeControl}>
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
