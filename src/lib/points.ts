export interface Tier {
  name: string;
  badge: string;
  color: string;
  minPoints: number;
}

export const TIERS: Tier[] = [
  { name: "owner",        badge: "shield_futuristic", color: "#FF4444", minPoints: -1 },
  { name: "moderator",    badge: "shield_gold",       color: "#44FF44", minPoints: -1 },
  { name: "shield_futuristic", badge: "shield_futuristic", color: "#C084FC", minPoints: 10000 },
  { name: "viper",        badge: "viper",             color: "#FFD700", minPoints: 5000 },
  { name: "shield_gold",  badge: "shield_gold",       color: "#FF6B00", minPoints: 2000 },
  { name: "shield_blue",  badge: "shield_blue",       color: "#00AAFF", minPoints: 500 },
  { name: "pokeball",     badge: "pokeball",          color: "#AAAAAA", minPoints: 0 },
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