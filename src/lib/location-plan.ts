import { prisma } from "./prisma";
import type { PlanId } from "./plans";
import type { SessionUser } from "./session";

export async function getLocationPlan(locationId: string | null | undefined): Promise<PlanId> {
  if (!locationId) return "STARTER";
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    select: { plan: true },
  });
  return location?.plan ?? "STARTER";
}

export async function enrichUserWithPlan(user: SessionUser): Promise<SessionUser> {
  const plan = await getLocationPlan(user.locationId);
  return { ...user, plan };
}
