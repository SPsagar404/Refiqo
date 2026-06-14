/** Relative time like "2h ago", "3d ago". */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}w ago`;
  return new Date(iso).toLocaleDateString();
}

/** Day bucket label for grouping (Today / Yesterday / Earlier). */
export function dayBucket(iso: string): 'Today' | 'Yesterday' | 'Earlier' {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = d.getTime();
  if (t >= startOfToday) return 'Today';
  if (t >= startOfToday - 86_400_000) return 'Yesterday';
  return 'Earlier';
}

export function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/** Brand color for a company name (used for the colored company label on cards). */
export function brandColor(company: string | null | undefined): string {
  const key = (company ?? '').toLowerCase();
  const map: Record<string, string> = {
    tcs: '#FF3059',
    infosys: '#28A8FF',
    wipro: '#FFFFFF',
    google: '#4285F4',
    amazon: '#FF9900',
    microsoft: '#2EA0F0',
    stripe: '#7C3CFF',
    atlassian: '#2684FF',
  };
  return map[key] ?? '#FFFFFF';
}

/** Treat a user as "online" if seen within the last 5 minutes. */
export function isRecentlyActive(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < 5 * 60 * 1000;
}
