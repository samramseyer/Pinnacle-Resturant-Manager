import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLocationIdFromRequest } from "@/lib/location";
import { requirePermission } from "@/lib/api-auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { error } = await requirePermission(request, "manage_compliance");
  if (error) return error;

  const { id } = await params;
  const locationId = await getLocationIdFromRequest(request);
  const body = await request.json();

  const existing = await prisma.incidentReport.findFirst({ where: { id, locationId } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const status = body.status ?? existing.status;
  const incident = await prisma.incidentReport.update({
    where: { id },
    data: {
      status,
      severity: body.severity,
      oshaRecordable: body.oshaRecordable,
      actionTaken: body.actionTaken !== undefined ? body.actionTaken?.trim() || null : undefined,
      witnessNotes: body.witnessNotes !== undefined ? body.witnessNotes?.trim() || null : undefined,
      closedAt: status === "CLOSED" ? new Date() : body.status === "OPEN" ? null : undefined,
    },
    include: { staffMember: { select: { name: true } } },
  });

  return NextResponse.json({
    ...incident,
    reportedAt: incident.reportedAt.toISOString(),
    closedAt: incident.closedAt?.toISOString() ?? null,
  });
}
