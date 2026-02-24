import { StbPluginDefinition, StbSubmodel } from "@/types";

const MAG_SUBMODELS: StbSubmodel[] = [
  { id: "MAG250", name: "MAG 250", logo: "/img/mag-250.png" },
  { id: "MAG255", name: "MAG 255", logo: "/img/mag-255.png" },
  { id: "MAG256", name: "MAG 256", logo: "/img/mag-generic.png" },
  { id: "MAG275", name: "MAG 275", logo: "/img/mag-generic.png" },
  { id: "AuraHD", name: "Aura HD", logo: "/img/aura-hd.png" },
];

const DUNEHD_SUBMODELS: StbSubmodel[] = [
  { id: "Dune HD TV-102", name: "Dune HD TV-102", logo: "/img/dune-hd-102.png" },
  { id: "Dune HD Connect", name: "Dune HD Connect", logo: "/img/dune-hd-102.png" },
];

const REGISTERED_PLUGINS: StbPluginDefinition[] = [
  {
    id: "mag-api",
    name: "MAG STB API",
    classId: "mag",
    submodels: MAG_SUBMODELS,
  },
  {
    id: "dunehd-api",
    name: "DuneHD STB API",
    classId: "dunehd",
    submodels: DUNEHD_SUBMODELS,
  },
];

export function getRegisteredPlugins(): StbPluginDefinition[] {
  return REGISTERED_PLUGINS;
}

export function getPluginByClassId(classId: string): StbPluginDefinition | null {
  return REGISTERED_PLUGINS.find((p) => p.classId === classId) ?? null;
}

export function getPluginIcon(classId: string, submodel?: string): string {
  const plugin = getPluginByClassId(classId);
  if (!plugin) return "/img/mag-generic.png";

  if (submodel) {
    const sub = plugin.submodels.find((s) => s.id === submodel);
    if (sub?.logo) return sub.logo;
  }

  return plugin.submodels[0]?.logo ?? "/img/mag-generic.png";
}

export function getAllSubmodels(): Array<{ classId: string; submodel: StbSubmodel; pluginName: string }> {
  return REGISTERED_PLUGINS.flatMap((plugin) =>
    plugin.submodels.map((submodel) => ({
      classId: plugin.classId,
      submodel,
      pluginName: plugin.name,
    }))
  );
}
