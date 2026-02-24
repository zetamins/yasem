import { NextResponse } from "next/server";
import {
  getProfileById,
  updateProfile,
  deleteProfile,
  saveProfileConfig,
  getProfileConfig,
} from "@/lib/profileStore";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const profile = getProfileById(id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json() as Record<string, unknown>;

  const profile = getProfileById(id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (Array.isArray(body)) {
    const success = saveProfileConfig(id, body as Array<{ name: string; value: string }>);
    return NextResponse.json({ success });
  }

  const updated = updateProfile(id, body as Record<string, string>);
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const success = deleteProfile(id);
  if (!success) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const profile = getProfileById(id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const config = getProfileConfig(profile, profile.classId);
  return NextResponse.json({
    submodel: profile.submodel,
    submodel_key: "profile/submodel",
    options: config.groups.flatMap((g) => g.options),
  });
}
