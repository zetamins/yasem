import { NextRequest, NextResponse } from "next/server";
import { getProfileById } from "@/lib/profileStore";
import { buildGStbScript, getDefaultState } from "@/lib/mag/gstbApi";
import { buildDuneApiScript, getDefaultDuneState } from "@/lib/dunehd/duneApi";
import { buildSamsungApiScript, getDefaultSamsungState } from "@/lib/samsung/samsungApi";

export async function GET(request: NextRequest) {
  const profileId = request.nextUrl.searchParams.get("profileId");
  if (!profileId) {
    return NextResponse.json({ error: "profileId required" }, { status: 400 });
  }

  const profile = getProfileById(profileId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let script: string;

  if (profile.classId === "samsung") {
    const state = getDefaultSamsungState(profile.config);
    script = buildSamsungApiScript(state, profile.config);
  } else if (profile.classId === "dunehd") {
    const state = getDefaultDuneState(profile.config);
    script = buildDuneApiScript(state, profile.config);
  } else {
    const state = getDefaultState();
    state.deviceModel = profile.config["profile/submodel"] || profile.submodel;
    state.deviceMac = profile.config["mag/mac_address"] || state.deviceMac;
    state.deviceSerial = profile.config["mag/serial_number"] || state.deviceSerial;
    script = buildGStbScript(state, profile.config);
  }

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
