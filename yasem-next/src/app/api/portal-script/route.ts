import { NextRequest, NextResponse } from "next/server";
import { getProfileById } from "@/lib/profileStore";
import { buildGStbScript, getDefaultState } from "@/lib/mag/gstbApi";

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const profile = getProfileById(profileId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const state = getDefaultState();
  state.deviceModel = profile.config["profile/submodel"] || profile.submodel;
  state.deviceMac = profile.config["mag/mac_address"] || state.deviceMac;
  state.deviceSerial = profile.config["mag/serial_number"] || state.deviceSerial;

  const script = buildGStbScript(state, profile.config);

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
