import { NextResponse } from "next/server";
import { getAllSubmodels } from "@/lib/pluginRegistry";

export async function GET() {
  const submodels = getAllSubmodels();
  const result = submodels.map(({ classId, submodel, pluginName }) => ({
    id: `${classId}:${submodel.id}`,
    classId,
    name: `${submodel.name}`,
    pluginName,
    logo: submodel.logo,
  }));
  return NextResponse.json(result);
}
