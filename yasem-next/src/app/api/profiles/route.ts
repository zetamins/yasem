import { NextResponse } from "next/server";
import {
  getAllProfiles,
  createProfile,
  addProfile,
} from "@/lib/profileStore";
import { getPluginIcon } from "@/lib/pluginRegistry";

export async function GET() {
  const profiles = getAllProfiles().filter((p) => !p.flags?.hidden);
  const result = profiles
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({
      id: p.id,
      name: p.name,
      classId: p.classId,
      submodel: p.submodel,
      url: p.portal,
      image: p.image || getPluginIcon(p.classId, p.submodel),
    }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json() as { classId: string; submodel: string; name?: string };
  const { classId, submodel, name } = body;

  if (!classId || !submodel) {
    return NextResponse.json({ error: "classId and submodel are required" }, { status: 400 });
  }

  const profile = createProfile(classId, submodel, name);
  addProfile(profile);

  return NextResponse.json({ id: profile.id, name: profile.name });
}
