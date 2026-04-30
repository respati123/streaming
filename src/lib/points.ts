export interface Tier {
  name: string;
  badge: string;
  color: string;
  minPoints: number;
}

export const TIERS: Tier[] = [
  { name: "owner",    badge: "crown",      color: "#FF4444", minPoints: -1 },
  { name: "moderator", badge: "shield",    color: "#44FF44", minPoints: -1 },
  { name: "gold",     badge: "star",       color: "#FFD700", minPoints: 1000 },
  { name: "loyal",    badge: "heart",      color: "#FF6B00", minPoints: 500 },
  { name: "regular",  badge: "thumbsup",   color: "#00AAFF", minPoints: 100 },
  { name: "viewer",   badge: "eye",        color: "#AAAAAA", minPoints: 0 },
];

export function getTier(points: number, isOwner = false, isModerator = false): Tier {
  if (isOwner) return TIERS[0];
  if (isModerator) return TIERS[1];
  for (const tier of TIERS.slice(2)) {
    if (points >= tier.minPoints) return tier;
  }
  return TIERS[TIERS.length - 1];
}

export const POINTS_PER_MESSAGE = 1;