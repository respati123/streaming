import { useEffect, useState } from 'react';
import styles from './StreamerbotActions.module.css';

interface Action {
  id: string;
  name: string;
  group?: string;
  enabled: boolean;
}

export function StreamerbotActions() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/streamerbot/actions')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.actions)) {
          setActions(d.actions);
        } else if (d.actions && Array.isArray(d.actions.actions)) {
          setActions(d.actions.actions);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExecute = async (id: string) => {
    setExecuting(id);
    try {
      await fetch(`/api/streamerbot/actions/${id}/execute`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to execute action', err);
    } finally {
      setTimeout(() => setExecuting(null), 1000);
    }
  };

  if (loading) return <div className={styles.loading}>Loading actions...</div>;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Streamer.bot Actions</h3>
      <div className={styles.grid}>
        {actions.map((action) => (
          <button
            key={action.id}
            className={`${styles.actionButton} ${executing === action.id ? styles.executing : ''}`}
            onClick={() => handleExecute(action.id)}
            disabled={!action.enabled || !!executing}
          >
            <span className={styles.actionName}>{action.name}</span>
            {action.group && <span className={styles.actionGroup}>{action.group}</span>}
          </button>
        ))}
        {actions.length === 0 && <div className={styles.empty}>No actions found</div>}
      </div>
    </div>
  );
}
