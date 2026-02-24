import { NextResponse } from "next/server";
import { getAllProfiles } from "@/lib/profileStore";

export async function GET() {
  const profiles = getAllProfiles();
  const json = JSON.stringify(profiles, null, 2);

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="yasem-profiles-${Date.now()}.json"`,
    },
  });
}
