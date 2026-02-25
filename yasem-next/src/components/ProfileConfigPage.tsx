"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileConfiguration, ConfigOption } from "@/types";
import styles from "./ProfileConfigPage.module.css";
import ShortcutsBar from "./ShortcutsBar";
import { preventFunctionKeyDefaults, CAPTURE_LISTENER_OPTIONS } from "@/lib/keyboard";

interface Props {
  profileId: string;
  profileName: string;
  config: ProfileConfiguration;
}

export default function ProfileConfigPage({ profileId, profileName, config }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const allOptions = config.groups.flatMap((g) => g.options);

  const saveProfile = async () => {
    if (!formRef.current || saving) return;
    setSaving(true);

    const formData = new FormData(formRef.current);
    const data: Array<{ name: string; value: string }> = [];

    for (const option of allOptions) {
      const key = `${option.tag}/${option.name}`;
      const value = formData.get(key) as string ?? "";
      data.push({ name: key, value });
    }

    try {
      await fetch(`/api/profiles/${profileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Always prevent default browser actions for F1-F4
      preventFunctionKeyDefaults(e, [1, 2, 3, 4]);

      // Normalize key detection: prefer e.code for function keys, fall back to e.key
      const key = e.code || e.key;

      switch (key) {
        case "F2":
          e.preventDefault();
          e.stopPropagation();
          saveProfile();
          break;
        case "Escape":
          e.preventDefault();
          e.stopPropagation();
          router.back();
          break;
      }
    };
    window.addEventListener("keydown", onKey, CAPTURE_LISTENER_OPTIONS);
    return () => window.removeEventListener("keydown", onKey, CAPTURE_LISTENER_OPTIONS);
  });

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>← Back</button>
        <h1 className={styles.title}>Configure: {profileName}</h1>
        <button
          className={`${styles.saveBtn} ${saved ? styles.saved : ""}`}
          onClick={saveProfile}
          disabled={saving}
        >
          {saving ? "Saving…" : saved ? "✓ Saved" : "Save (F2)"}
        </button>
      </header>

      <main className={styles.main}>
        <form ref={formRef} onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
          {config.groups.map((group) => (
            <section key={group.title} className={styles.group}>
              <h2 className={styles.groupTitle}>{group.title}</h2>
              <div className={styles.optionsGrid}>
                {group.options.map((option) => (
                  <ConfigField key={`${option.tag}/${option.name}`} option={option} />
                ))}
              </div>
            </section>
          ))}
        </form>
      </main>

      <ShortcutsBar shortcuts={[{ id: "ESC", text: "Return" }, { id: "F2", text: "Save profile" }]} />
    </div>
  );
}

function ConfigField({ option }: { option: ConfigOption }) {
  const fieldId = `${option.tag}/${option.name}`;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={fieldId}>
        {option.title}
      </label>
      <div className={styles.inputWrapper}>
        {option.type === "bool" ? (
          <select
            id={fieldId}
            name={fieldId}
            className={styles.input}
            defaultValue={option.value}
          >
            <option value="true">TRUE</option>
            <option value="false">FALSE</option>
          </select>
        ) : option.type === "select" && option.options ? (
          <select
            id={fieldId}
            name={fieldId}
            className={styles.input}
            defaultValue={option.value}
          >
            {Object.entries(option.options).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        ) : (
          <input
            id={fieldId}
            name={fieldId}
            type="text"
            className={styles.input}
            defaultValue={option.value}
          />
        )}
      </div>
      {option.comment && (
        <p className={styles.comment}>{option.comment}</p>
      )}
    </div>
  );
}
