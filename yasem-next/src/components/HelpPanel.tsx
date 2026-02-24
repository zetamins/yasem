import styles from "./HelpPanel.module.css";

interface Props {
  onClose: () => void;
}

export default function HelpPanel({ onClose }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>Application Help</h2>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        <section>
          <h3 className={styles.sectionTitle}>Global Shortcuts</h3>
          <table className={styles.table}>
            <tbody>
              <tr>
                <td><span className={styles.kbd}>↑ ↓ ← →</span></td>
                <td>Navigate profiles</td>
              </tr>
              <tr>
                <td><span className={styles.kbd}>Enter</span> or <span className={styles.kbd}>Click</span></td>
                <td>Load profile / launch portal</td>
              </tr>
              <tr>
                <td><span className={styles.kbd}>ESC</span></td>
                <td>Back / close dialog</td>
              </tr>
              <tr>
                <td><span className={styles.kbd}>F11</span></td>
                <td>Toggle fullscreen</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className={styles.sectionTitle}>Main Menu Shortcuts</h3>
          <table className={styles.table}>
            <tbody>
              <tr>
                <td><span className={`${styles.kbd} ${styles.f1}`}>F1</span></td>
                <td>Toggle this help</td>
              </tr>
              <tr>
                <td><span className={`${styles.kbd} ${styles.f2}`}>F2</span></td>
                <td>Edit selected profile</td>
              </tr>
              <tr>
                <td><span className={`${styles.kbd} ${styles.f3}`}>F3</span></td>
                <td>Create new profile</td>
              </tr>
              <tr>
                <td><span className={`${styles.kbd} ${styles.f4}`}>F4</span></td>
                <td>Delete selected profile</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h3 className={styles.sectionTitle}>Portal Shortcuts</h3>
          <table className={styles.table}>
            <tbody>
              <tr>
                <td>
                  <span className={`${styles.kbd} ${styles.f1}`}>F1</span>{" "}
                  <span className={`${styles.kbd} ${styles.f2}`}>F2</span>{" "}
                  <span className={`${styles.kbd} ${styles.f3}`}>F3</span>{" "}
                  <span className={`${styles.kbd} ${styles.f4}`}>F4</span>
                </td>
                <td>Color buttons (Red / Green / Yellow / Blue)</td>
              </tr>
              <tr>
                <td><span className={styles.kbd}>Tab</span></td>
                <td>Open STB menu</td>
              </tr>
              <tr>
                <td><span className={styles.kbd}>PgUp</span> / <span className={styles.kbd}>PgDown</span></td>
                <td>Page up / Page down</td>
              </tr>
              <tr>
                <td><span className={styles.kbd}>Shift</span>+<span className={styles.kbd}>←</span></td>
                <td>Rewind</td>
              </tr>
              <tr>
                <td><span className={styles.kbd}>Shift</span>+<span className={styles.kbd}>→</span></td>
                <td>Fast forward</td>
              </tr>
              <tr>
                <td><span className={styles.kbd}>F6</span></td>
                <td>Info</td>
              </tr>
              <tr>
                <td><span className={styles.kbd}>Backspace</span></td>
                <td>Back to profile list</td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
