import styles from "./ShortcutsBar.module.css";

interface Shortcut {
  id: string;
  text: string;
}

interface Props {
  shortcuts: Shortcut[];
}

const KEY_COLORS: Record<string, string> = {
  F1: "#cc0000",
  F2: "#006600",
  F3: "#cccc00",
  F4: "#000099",
};

export default function ShortcutsBar({ shortcuts }: Props) {
  return (
    <div className={styles.bar}>
      {shortcuts.map((s) => (
        <div key={s.id} className={styles.shortcut}>
          <span
            className={styles.key}
            style={{ backgroundColor: KEY_COLORS[s.id] || "#1e2d50" }}
          >
            {s.id}
          </span>
          <span className={styles.title}>{s.text}</span>
        </div>
      ))}
    </div>
  );
}
