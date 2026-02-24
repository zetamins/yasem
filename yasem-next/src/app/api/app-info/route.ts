import { NextResponse } from "next/server";
import { AppInfo } from "@/types";

export async function GET() {
  const info: AppInfo = {
    name: "YASEM",
    version: "0.1.0-next",
    copyright: "Copyright © 2013-2015 Maxim Vasilchuk — Next.js rewrite",
  };
  return NextResponse.json(info);
}
