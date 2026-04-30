import type { ApiUser } from "../lib/types";
import { BADGE_EMOJI } from "../lib/types";
import styles from "./Leaderboard.module.css";

interface Props {
  users: ApiUser[];
}

function getBadge(points: number): string {
  if (points >= 1000) return "star";
  if (points >= 500) return "heart";
  if (points >= 100) return "thumbsup";
  return "eye";
}

function getColor(points: number): string {
  if (points >= 1000) return "#FFD700";
  if (points >= 500) return "#FF6B00";
  if (points >= 100) return "#00AAFF";
  return "#AAAAAA";
}

export function Leaderboard({ users }: Props) {
  const top = [...users].sort((a, b) => b.points - a.points).slice(0, 10);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Leaderboard</h3>
      <div className={styles.list}>
        {top.map((user, i) => (
          <div key={user.youtubeId} className={styles.row}>
            <span className={styles.rank}>#{i + 1}</span>
            {user.profileImageUrl && (
              <img
                className={styles.avatar}
                src={user.profileImageUrl}
                alt={user.name}
              />
            )}
            <span
              className={styles.name}
              style={{ color: getColor(user.points) }}
            >
              {BADGE_EMOJI[getBadge(user.points)]} {user.name}
            </span>
            <span className={styles.points}>{user.points} pts</span>
          </div>
        ))}
        {top.length === 0 && (
          <div className={styles.empty}>No users yet</div>
        )}
      </div>
    </div>
  );
}
