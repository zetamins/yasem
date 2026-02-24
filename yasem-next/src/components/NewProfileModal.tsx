"use client";

import { useEffect, useState } from "react";
import styles from "./NewProfileModal.module.css";

interface StbType {
  id: string;
  classId: string;
  name: string;
  pluginName: string;
  logo?: string;
}

interface Props {
  onClose: () => void;
  onCreate: (classId: string, submodel: string) => Promise<void>;
}

export default function NewProfileModal({ onClose, onCreate }: Props) {
  const [stbTypes, setStbTypes] = useState<StbType[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/stb-types")
      .then((r) => r.json())
      .then((d) => setStbTypes(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          setSelectedIndex((i) => (i + 1) % Math.max(stbTypes.length, 1));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setSelectedIndex((i) => (i - 1 + stbTypes.length) % Math.max(stbTypes.length, 1));
          break;
        case "Enter":
          e.preventDefault();
          handleSelect(stbTypes[selectedIndex]);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [stbTypes, selectedIndex, onClose]);

  const handleSelect = async (type: StbType | undefined) => {
    if (!type || creating) return;
    setCreating(true);
    try {
      const [classId, submodel] = type.id.split(":");
      await onCreate(classId, submodel);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Create New Profile</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>
        <p className={styles.hint}>Select device type:</p>
        <div className={styles.grid}>
          {stbTypes.map((type, index) => (
            <button
              key={type.id}
              className={`${styles.typeCard} ${index === selectedIndex ? styles.selected : ""}`}
              onClick={() => handleSelect(type)}
              onMouseEnter={() => setSelectedIndex(index)}
              disabled={creating}
            >
              {type.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={type.logo} alt={type.name} className={styles.logo} />
              )}
              <span className={styles.typeName}>{type.name}</span>
              <span className={styles.pluginName}>{type.pluginName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
