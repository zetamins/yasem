import { NextRequest, NextResponse } from "next/server";
import { addProfile, getAllProfiles } from "@/lib/profileStore";
import { Profile } from "@/types";

export async function POST(request: NextRequest) {
  let imported: Profile[];

  try {
    const body = await request.json() as Profile | Profile[];
    imported = Array.isArray(body) ? body : [body];
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const existing = getAllProfiles();
  const existingIds = new Set(existing.map((p) => p.id));

  let added = 0;
  let skipped = 0;

  for (const profile of imported) {
    if (!profile.id || !profile.classId || !profile.name) {
      skipped++;
      continue;
    }
    if (existingIds.has(profile.id)) {
      skipped++;
      continue;
    }
    addProfile(profile);
    added++;
  }

  return NextResponse.json({ added, skipped });
}
