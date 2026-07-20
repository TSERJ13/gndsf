"use server";

import { db } from "@/lib/db";
import { requireUser, clubScope, REGISTRY_ADMINS } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function requestTransfer(formData: FormData) {
  const user = await requireUser();
  const scope = clubScope(user);
  const isRegistryAdmin = REGISTRY_ADMINS.includes(user.role);

  if (!isRegistryAdmin && user.role !== "CLUB_MANAGER") {
    throw new Error("Access denied");
  }

  const gid = formData.get("gid") as string;
  const adminToClubId = formData.get("toClubId") as string;
  
  const toClubId = isRegistryAdmin && adminToClubId ? adminToClubId : scope?.clubId;

  if (!toClubId) {
    redirect("/portal/transfers?error=unauthorized");
  }

  const athlete = await db.athlete.findUnique({
    where: { gid },
    include: {
      clubMemberships: {
        where: { endDate: null },
      },
    },
  });

  if (!athlete) {
    redirect("/portal/transfers?error=not_found");
  }

  const currentMembership = athlete.clubMemberships[0];
  const fromClubId = currentMembership?.clubId;

  if (fromClubId === toClubId) {
    redirect("/portal/transfers?error=already_in_club");
  }

  const existingPending = await db.clubTransferRequest.findFirst({
    where: {
      athleteId: athlete.id,
      status: "PENDING",
    },
  });

  if (existingPending) {
    redirect("/portal/transfers?error=pending_exists");
  }

  await db.clubTransferRequest.create({
    data: {
      athleteId: athlete.id,
      fromClubId: fromClubId || null,
      toClubId: toClubId,
      requestedById: user.id,
    },
  });

  revalidatePath("/portal/transfers");
  redirect("/portal/transfers?ok=requested");
}

export async function approveTransfer(formData: FormData) {
  const user = await requireUser();
  const scope = clubScope(user);
  const isRegistryAdmin = REGISTRY_ADMINS.includes(user.role);

  const id = formData.get("id") as string;

  const request = await db.clubTransferRequest.findUnique({
    where: { id },
  });

  if (!request || request.status !== "PENDING") {
    throw new Error("Invalid request");
  }

  const canApprove = isRegistryAdmin || (scope && scope.clubId === request.fromClubId);
  
  if (!canApprove) {
    throw new Error("Access denied");
  }

  // Transaction: close old membership, create new one, update request status
  await db.$transaction(async (tx) => {
    // 1. Close current membership if exists
    if (request.fromClubId) {
      await tx.clubMembership.updateMany({
        where: {
          athleteId: request.athleteId,
          clubId: request.fromClubId,
          endDate: null,
        },
        data: {
          endDate: new Date(),
        },
      });
    }

    // 2. Create new membership
    await tx.clubMembership.create({
      data: {
        athleteId: request.athleteId,
        clubId: request.toClubId,
        startDate: new Date(),
      },
    });

    // 3. Mark request as APPROVED
    await tx.clubTransferRequest.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    
    // 4. Audit Log
    await tx.auditLog.create({
      data: {
        userId: user.id,
        action: "TRANSFER_APPROVE",
        entity: "Athlete",
        entityId: request.athleteId,
        detail: `Transferred to ${request.toClubId}`,
      },
    });
  });

  revalidatePath("/portal/transfers");
  revalidatePath("/portal/athletes");
  redirect("/portal/transfers?ok=approved");
}

export async function rejectTransfer(formData: FormData) {
  const user = await requireUser();
  const scope = clubScope(user);
  const isRegistryAdmin = REGISTRY_ADMINS.includes(user.role);

  const id = formData.get("id") as string;

  const request = await db.clubTransferRequest.findUnique({
    where: { id },
  });

  if (!request || request.status !== "PENDING") {
    throw new Error("Invalid request");
  }

  const canApprove = isRegistryAdmin || (scope && scope.clubId === request.fromClubId);
  
  if (!canApprove) {
    throw new Error("Access denied");
  }

  await db.clubTransferRequest.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  revalidatePath("/portal/transfers");
  redirect("/portal/transfers?ok=rejected");
}
