"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./PortalViewer.module.css";
import VideoPlayer from "./VideoPlayer";
import { preventFunctionKeyDefaults, CAPTURE_LISTENER_OPTIONS } from "@/lib/keyboard";

interface Props {
  profileId: string;
  profileName: string;
  portalUrl: string;
  classId: string;
  submodel: string;
  aspectRatio?: string;
}

type TopWidget = "browser" | "video";

interface PlayerCommand {
  type: "play" | "pause" | "stop" | "setVolume" | "seek" | "setLoop" | "setMute" | "setSpeed" | "setAspect";
  payload?: unknown;
}

export default function PortalViewer({ profileId, profileName, portalUrl, classId, submodel, aspectRatio = "auto" }: Props) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [topWidget, setTopWidget] = useState<TopWidget>("browser");
  const [playerCmd, setPlayerCmd] = useState<PlayerCommand | null>(null);
  const [playerUrl, setPlayerUrl] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [portalError, setPortalError] = useState("");
  const playerCmdRef = useRef(setPlayerCmd);
  playerCmdRef.current = setPlayerCmd;

  const sendToPortal = useCallback((js: string) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      (win as Window & { eval: (code: string) => void }).eval(js);
    } catch {
      console.warn("Could not eval in portal frame:", js);
    }
  }, []);

  useEffect(() => {
    if (!portalUrl) {
      setPortalError("No portal URL configured. Please edit the profile.");
    }
  }, [portalUrl]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;
      const { type, payload } = e.data as { type: string; payload: unknown };

      switch (type) {
        case "yasem:play":
          setPlayerUrl((payload as { url: string }).url);
          setTopWidget("video");
          setPlayerCmd({ type: "play", payload });
          break;
        case "yasem:pause":
          setPlayerCmd({ type: "pause" });
          break;
        case "yasem:stop":
          setPlayerCmd({ type: "stop" });
          setTopWidget("browser");
          break;
        case "yasem:setVolume":
          setPlayerCmd({ type: "setVolume", payload });
          break;
        case "yasem:setMute":
          setPlayerCmd({ type: "setMute", payload });
          break;
        case "yasem:seek":
          setPlayerCmd({ type: "seek", payload });
          break;
        case "yasem:setLoop":
          setPlayerCmd({ type: "setLoop", payload });
          break;
        case "yasem:topWindow":
          setTopWidget((payload as { winNum: number }).winNum === 1 ? "video" : "browser");
          break;
        case "yasem:loadUrl":
          if (iframeRef.current) {
            iframeRef.current.src = (payload as { url: string }).url;
          }
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Always prevent default browser actions for F1-F4
      // This prevents Firefox from opening Help (F1) or other default actions
      preventFunctionKeyDefaults(e, [1, 2, 3, 4]);

      // Normalize key detection: prefer e.code for function keys, fall back to e.key
      const key = e.code || e.key;

      if (key === "Backspace" && !e.defaultPrevented) {
        e.preventDefault();
        e.stopPropagation();
        router.push("/");
        return;
      }
      if (key === "F11") {
        e.preventDefault();
        e.stopPropagation();
        setFullscreen((f) => {
          if (!f) {
            document.documentElement.requestFullscreen?.().catch(() => {});
          } else {
            document.exitFullscreen?.().catch(() => {});
          }
          return !f;
        });
        return;
      }

      if (!iframeRef.current?.contentWindow) return;

      const RC_MAP: Record<string, number> = {
        F1: 112,
        F2: 113,
        F3: 114,
        F4: 115,
        F5: 116,
        F6: 117,
        Tab: 9,
        PageUp: 33,
        PageDown: 34,
        ArrowLeft: 37,
        ArrowUp: 38,
        ArrowRight: 39,
        ArrowDown: 40,
        Enter: 13,
        Escape: 27,
        Backspace: 8,
      };

      const keyCode = RC_MAP[key];
      if (keyCode !== undefined) {
        e.preventDefault();
        e.stopPropagation();
        const js = `
          (function() {
            var ev = new KeyboardEvent('keydown', {
              keyCode: ${keyCode},
              which: ${keyCode},
              bubbles: true,
              cancelable: true,
              shiftKey: ${e.shiftKey}
            });
            document.dispatchEvent(ev);
          })();
        `;
        sendToPortal(js);
      }
    };

    window.addEventListener("keydown", onKey, CAPTURE_LISTENER_OPTIONS);
    return () => window.removeEventListener("keydown", onKey, CAPTURE_LISTENER_OPTIONS);
  }, [router, sendToPortal]);

  const scriptUrl = `/api/portal-script?profileId=${encodeURIComponent(profileId)}`;

  const iframeSrc = portalUrl
    ? `/api/portal-proxy?url=${encodeURIComponent(portalUrl)}&profileId=${encodeURIComponent(profileId)}`
    : "";

  return (
    <div className={`${styles.root} ${fullscreen ? styles.fullscreen : ""}`}>
      <div
        className={styles.browserLayer}
        style={{ zIndex: topWidget === "browser" ? 2 : 1 }}
      >
        {portalError ? (
          <div className={styles.errorPane}>
            <p>{portalError}</p>
            <button onClick={() => router.push(`/profiles/${profileId}/config`)}>
              Configure Profile
            </button>
            <button onClick={() => router.push("/")}>← Back to Profiles</button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            className={styles.iframe}
            src={iframeSrc}
            title={`Portal: ${profileName}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            allow="autoplay; fullscreen"
            onLoad={() => {
              const iframe = iframeRef.current;
              if (!iframe?.contentWindow) return;
              const inject = `
                (function() {
                  var script = document.createElement('script');
                  script.src = '${scriptUrl}';
                  script.onload = function() {
                    console.log('[YASEM] GStb API injected for ${classId}/${submodel}');
                  };
                  (document.head || document.documentElement).appendChild(script);
                })();
              `;
              try {
                (iframe.contentWindow as Window & { eval: (code: string) => void }).eval(inject);
              } catch {
                console.warn("[YASEM] Could not inject portal script (cross-origin)");
              }
            }}
          />
        )}
      </div>

      <div
        className={styles.videoLayer}
        style={{ zIndex: topWidget === "video" ? 2 : 1 }}
      >
        <VideoPlayer
          url={playerUrl}
          command={playerCmd}
          aspectRatio={aspectRatio}
          onStateChange={(state) => {
            sendToPortal(`
              window.dispatchEvent(new CustomEvent('yasem:playerState', { detail: ${JSON.stringify(state)} }));
            `);
          }}
        />
      </div>

      <div className={styles.topBar}>
        <span className={styles.profileName}>{profileName}</span>
        <div className={styles.topBarActions}>
          <button
            className={styles.topBtn}
            onClick={() => router.push("/")}
            title="Back to profiles (Backspace)"
          >
            ← Profiles
          </button>
          <button
            className={styles.topBtn}
            onClick={() => setFullscreen((f) => !f)}
            title="Toggle fullscreen (F11)"
          >
            {fullscreen ? "⊡" : "⊞"}
          </button>
        </div>
      </div>
    </div>
  );
}
