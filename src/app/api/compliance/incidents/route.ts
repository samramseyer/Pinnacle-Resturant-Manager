import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocationIdFromRequest } from "@/lib/location";
import { requirePermission, requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const { error } = await requirePermission(request, "manage_compliance");
  if (error) return error;

  const locationId = await getLocationIdFromRequest(request);
  const status = request.nextUrl.searchParams.get("status");

  const incidents = await prisma.incidentReport.findMany({
    where: {
      locationId,
      ...(status ? { status: status as never } : {}),
    },
    include: { staffMember: { select: { name: true, role: true } } },
    orderBy: { reportedAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    incidents: incidents.map((i) => ({
      ...i,
      reportedAt: i.reportedAt.toISOString(),
      closedAt: i.closedAt?.toISOString() ?? null,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { error: permError } = await requirePermission(request, "manage_compliance");
  if (permError) return permError;

  const locationId = await getLocationIdFromRequest(request);
  const body = await request.json();

  if (!body.incidentType || !body.category || !body.description?.trim()) {
    return NextResponse.json({ error: "Type, category, and description required" }, { status: 400 });
  }

  const incident = await prisma.incidentReport.create({
    data: {
      locationId,
      incidentType: body.incidentType,
      category: body.category,
      description: body.description.trim(),
      staffMemberId: body.staffMemberId || null,
      guestName: body.guestName?.trim() || null,
      severity: body.severity || "MEDIUM",
      oshaRecordable: Boolean(body.oshaRecordable),
      actionTaken: body.actionTaken?.trim() || null,
      witnessNotes: body.witnessNotes?.trim() || null,
      reportedByName: body.reportedByName?.trim() || user!.name,
      reportedAt: body.reportedAt ? new Date(body.reportedAt) : new Date(),
    },
    include: { staffMember: { select: { name: true } } },
  });

  await prisma.activityLog.create({
    data: {
      locationId,
      action: "CREATE",
      entity: "incident",
      entityId: incident.id,
      details: `${incident.incidentType} — ${incident.category}`,
    },
  });

  return NextResponse.json({
    ...incident,
    reportedAt: incident.reportedAt.toISOString(),
    createdAt: incident.createdAt.toISOString(),
    updatedAt: incident.updatedAt.toISOString(),
  });
}
