import styles from "./WebcamFrame.module.css";

export function WebcamFrame() {
  return (
    <div className={styles.container}>
      <div className={styles.frame}>
        {/* Label for the webcam area */}
        <div className={styles.label}>
          LIVE / CAM
        </div>
        
        {/* Corner Decorations */}
        <div className={`${styles.corner} ${styles.topLeft}`}></div>
        <div className={`${styles.corner} ${styles.topRight}`}></div>
        <div className={`${styles.corner} ${styles.bottomLeft}`}></div>
        <div className={`${styles.corner} ${styles.bottomRight}`}></div>
      </div>
    </div>
  );
}
