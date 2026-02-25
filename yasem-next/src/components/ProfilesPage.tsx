"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./ProfilesPage.module.css";
import ProfileCard from "./ProfileCard";
import NewProfileModal from "./NewProfileModal";
import HelpPanel from "./HelpPanel";
import ShortcutsBar from "./ShortcutsBar";
import { preventFunctionKeyDefaults, CAPTURE_LISTENER_OPTIONS } from "@/lib/keyboard";

interface ProfileInfo {
  id: string;
  name: string;
  classId: string;
  submodel: string;
  url: string;
  image: string;
}

type Page = "profiles" | "help";

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<ProfileInfo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>("profiles");
  const [appInfo, setAppInfo] = useState({ version: "", copyright: "" });
  const [loading, setLoading] = useState(true);
  const importInputRef = useRef<HTMLInputElement>(null);

  const loadProfiles = useCallback(async () => {
    try {
      const res = await fetch("/api/profiles");
      const data = await res.json() as ProfileInfo[];
      setProfiles(data);
    } catch (err) {
      console.error("Failed to load profiles", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
    fetch("/api/app-info")
      .then((r) => r.json())
      .then((d) => setAppInfo(d))
      .catch(() => {});
  }, [loadProfiles]);

  const selectedProfile = profiles[selectedIndex] ?? null;

  const loadProfile = useCallback(
    (id: string) => {
      router.push(`/portal/${id}`);
    },
    [router]
  );

  const editProfile = useCallback(
    (id: string) => {
      router.push(`/profiles/${id}/config`);
    },
    [router]
  );

  const removeProfile = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Remove profile "${name}"?`)) return;
      await fetch(`/api/profiles/${id}`, { method: "DELETE" });
      await loadProfiles();
      setSelectedIndex(0);
    },
    [loadProfiles]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Always prevent default browser actions for F1-F4, even when modal is open
      // This prevents Firefox from opening Help (F1) or other default actions
      const isFnKey = preventFunctionKeyDefaults(e, [1, 2, 3, 4]);

      if (showNewProfileModal) {
        // If modal is open, don't process these keys but still prevent defaults
        return;
      }

      const total = profiles.length;
      if (total === 0) return;

      const COLS = 5;

      // Normalize key detection: prefer e.code for function keys, fall back to e.key
      const key = e.code || e.key;

      switch (key) {
        case "ArrowRight":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((i) => (i + 1) % total);
          break;
        case "ArrowLeft":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((i) => (i - 1 + total) % total);
          break;
        case "ArrowDown":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((i) => Math.min(i + COLS, total - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          e.stopPropagation();
          setSelectedIndex((i) => Math.max(i - COLS, 0));
          break;
        case "Enter":
          e.preventDefault();
          e.stopPropagation();
          if (selectedProfile) loadProfile(selectedProfile.id);
          break;
        case "F1":
          e.preventDefault();
          e.stopPropagation();
          setCurrentPage((p) => (p === "help" ? "profiles" : "help"));
          break;
        case "F2":
          e.preventDefault();
          e.stopPropagation();
          if (selectedProfile) editProfile(selectedProfile.id);
          break;
        case "F3":
          e.preventDefault();
          e.stopPropagation();
          setShowNewProfileModal(true);
          break;
        case "F4":
          e.preventDefault();
          e.stopPropagation();
          if (selectedProfile) removeProfile(selectedProfile.id, selectedProfile.name);
          break;
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          if (currentPage === "help") setCurrentPage("profiles");
          break;
      }
    };

    window.addEventListener("keydown", onKey, CAPTURE_LISTENER_OPTIONS);
    return () => window.removeEventListener("keydown", onKey, CAPTURE_LISTENER_OPTIONS);
  }, [profiles, selectedIndex, selectedProfile, showNewProfileModal, currentPage, loadProfile, editProfile, removeProfile]);

  const shortcuts =
    currentPage === "help"
      ? [{ id: "ESC", text: "Return" }]
      : [
          { id: "F1", text: "Help" },
          { id: "F2", text: "Edit profile" },
          { id: "F3", text: "New profile" },
          { id: "F4", text: "Remove profile" },
        ];

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.logo}>YASEM</h1>
        <span className={styles.subtitle}>Yet Another STB EMulator</span>
      </header>

      {currentPage === "help" && (
        <HelpPanel onClose={() => setCurrentPage("profiles")} />
      )}

      {currentPage === "profiles" && (
        <main className={styles.main}>
          {loading ? (
            <p className={styles.empty}>Loading profiles…</p>
          ) : profiles.length === 0 ? (
            <p className={styles.empty}>
              No profiles yet. Press <kbd>F3</kbd> to create one.
            </p>
          ) : (
            <div className={styles.grid}>
              {profiles.map((profile, index) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  selected={index === selectedIndex}
                  onClick={() => {
                    setSelectedIndex(index);
                    loadProfile(profile.id);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                />
              ))}
            </div>
          )}
        </main>
      )}

      <ShortcutsBar shortcuts={shortcuts} />

      <footer className={styles.footer}>
        <span className={styles.copyright}>{appInfo.copyright}</span>
        <div className={styles.footerActions}>
          <button
            className={styles.footerBtn}
            onClick={() => { window.location.href = "/api/profiles/export"; }}
            title="Export all profiles to JSON"
          >
            ↓ Export
          </button>
          <button
            className={styles.footerBtn}
            onClick={() => importInputRef.current?.click()}
            title="Import profiles from JSON"
          >
            ↑ Import
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const data = JSON.parse(text) as unknown;
                const res = await fetch("/api/profiles/import", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                });
                const result = await res.json() as { added: number; skipped: number };
                alert(`Imported ${result.added} profile(s), skipped ${result.skipped}.`);
                await loadProfiles();
              } catch {
                alert("Failed to import profiles. Please check the file format.");
              }
              e.target.value = "";
            }}
          />
        </div>
        <span className={styles.version}>{appInfo.version}</span>
      </footer>

      {showNewProfileModal && (
        <NewProfileModal
          onClose={() => setShowNewProfileModal(false)}
          onCreate={async (classId, submodel) => {
            const res = await fetch("/api/profiles", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ classId, submodel }),
            });
            const data = await res.json() as { id: string };
            setShowNewProfileModal(false);
            await loadProfiles();
            router.push(`/profiles/${data.id}/config`);
          }}
        />
      )}
    </div>
  );
}
