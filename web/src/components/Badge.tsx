import { BADGE_EMOJI } from "../lib/types";
import type { ChatUser } from "../lib/types";
import styles from "./Badge.module.css";

interface Props {
  badge: string;
}

export function Badge({ badge }: Props) {
  return (
    <span className={styles.badge} title={badge}>
      {BADGE_EMOJI[badge] ?? ""}
    </span>
  );
}
