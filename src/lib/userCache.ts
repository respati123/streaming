import prisma from "./prisma";
import { getTier, POINTS_PER_MESSAGE, type Tier } from "./points";

export interface CachedUser {
  youtubeId: string;
  name: string;
  profileImageUrl: string | null;
  points: number;
  dbId: number;
  tier: Tier;
  isOwner: boolean;
  isModerator: boolean;
}

const userCache = new Map<string, CachedUser>();

export function getCachedUser(youtubeId: string): CachedUser | undefined {
  return userCache.get(youtubeId);
}

export async function getOrCreateUser(youtubeId: string, name: string, profileImageUrl: string, isOwner: boolean, isModerator: boolean): Promise<CachedUser> {
  const cached = userCache.get(youtubeId);
  if (cached) {
    cached.name = name;
    cached.profileImageUrl = profileImageUrl;
    cached.isOwner = isOwner;
    cached.isModerator = isModerator;
    cached.tier = getTier(cached.points, isOwner, isModerator);
    return cached;
  }

  const dbUser = await prisma.user.upsert({
    where: { youtubeId },
    update: { name, profileImageUrl, lastSeen: new Date() },
    create: { youtubeId, name, profileImageUrl, lastSeen: new Date() },
  });

  const user: CachedUser = {
    youtubeId,
    name,
    profileImageUrl,
    points: dbUser.points,
    dbId: dbUser.id,
    tier: getTier(dbUser.points, isOwner, isModerator),
    isOwner,
    isModerator,
  };

  userCache.set(youtubeId, user);
  return user;
}

export function addPoints(youtubeId: string, amount: number = POINTS_PER_MESSAGE): void {
  const user = userCache.get(youtubeId);
  if (!user) return;
  user.points += amount;
  user.tier = getTier(user.points, user.isOwner, user.isModerator);
}

export function getAllCachedUsers(): CachedUser[] {
  return Array.from(userCache.values());
}

export async function syncPointsToDb(): Promise<void> {
  const users = Array.from(userCache.values());
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.dbId },
      data: { points: user.points },
    });
  }
}

setInterval(() => { syncPointsToDb().catch(console.error); }, 30_000);