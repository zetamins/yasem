import fs from "fs";
import path from "path";
import { Profile, ProfileConfiguration } from "@/types";

const DATA_DIR = process.env.YASEM_DATA_DIR
  ? path.resolve(process.env.YASEM_DATA_DIR)
  : path.join(process.cwd(), "data");

const PROFILES_FILE = path.join(DATA_DIR, "profiles.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readProfiles(): Profile[] {
  ensureDataDir();
  if (!fs.existsSync(PROFILES_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(PROFILES_FILE, "utf-8");
    return JSON.parse(raw) as Profile[];
  } catch {
    return [];
  }
}

function writeProfiles(profiles: Profile[]): void {
  ensureDataDir();
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), "utf-8");
}

function generateId(): string {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getAllProfiles(): Profile[] {
  return readProfiles();
}

export function getProfileById(id: string): Profile | null {
  const profiles = readProfiles();
  return profiles.find((p) => p.id === id) ?? null;
}

export function getProfileByName(name: string): Profile | null {
  const profiles = readProfiles();
  return profiles.find((p) => p.name === name) ?? null;
}

export function createProfile(
  classId: string,
  submodel: string,
  name?: string,
  overwrite = false
): Profile {
  const profiles = readProfiles();
  const baseName = name || `${classId}-${submodel}`;

  let finalName = baseName;
  if (!overwrite) {
    let counter = 1;
    while (profiles.some((p) => p.name === finalName)) {
      finalName = `${baseName} (${counter++})`;
    }
  }

  const existing = profiles.find((p) => p.name === finalName);
  if (overwrite && existing) {
    return existing;
  }

  const profile: Profile = {
    id: generateId(),
    name: finalName,
    classId,
    submodel,
    portal: "",
    config: {},
  };

  profiles.push(profile);
  writeProfiles(profiles);
  return profile;
}

export function updateProfile(id: string, updates: Partial<Profile>): Profile | null {
  const profiles = readProfiles();
  const index = profiles.findIndex((p) => p.id === id);
  if (index === -1) return null;

  profiles[index] = { ...profiles[index], ...updates };
  writeProfiles(profiles);
  return profiles[index];
}

export function saveProfileConfig(
  id: string,
  configData: Array<{ name: string; value: string }>
): boolean {
  const profiles = readProfiles();
  const index = profiles.findIndex((p) => p.id === id);
  if (index === -1) return false;

  const profile = profiles[index];
  for (const item of configData) {
    const parts = item.name.split("/");
    if (parts.length === 2) {
      profile.config[`${parts[0]}/${parts[1]}`] = item.value;
      if (parts[0] === "profile" && parts[1] === "portal") {
        profile.portal = item.value;
      }
      if (parts[0] === "profile" && parts[1] === "name") {
        profile.name = item.value;
      }
    } else {
      profile.config[item.name] = item.value;
    }
  }

  profiles[index] = profile;
  writeProfiles(profiles);
  return true;
}

export function deleteProfile(id: string): boolean {
  const profiles = readProfiles();
  const index = profiles.findIndex((p) => p.id === id);
  if (index === -1) return false;

  profiles.splice(index, 1);
  writeProfiles(profiles);
  return true;
}

export function addProfile(profile: Profile): void {
  const profiles = readProfiles();
  if (!profiles.some((p) => p.id === profile.id)) {
    profiles.push(profile);
    writeProfiles(profiles);
  }
}

export function getProfileConfig(
  profile: Profile,
  classId: string
): ProfileConfiguration {
  return getConfigurationForClass(profile, classId);
}

function getConfigurationForClass(
  profile: Profile,
  classId: string
): ProfileConfiguration {
  const getValue = (tag: string, name: string, def = "") =>
    profile.config[`${tag}/${name}`] ?? def;

  if (classId === "mag" || classId === "mag-api") {
    return {
      groups: [
        {
          title: "Profile",
          options: [
            {
              tag: "profile",
              name: "name",
              title: "Profile name",
              value: getValue("profile", "name", profile.name),
              type: "string",
            },
            {
              tag: "profile",
              name: "portal",
              title: "Portal URL",
              comment: "IPTV portal URL (e.g. http://portal.example.com/stalker_portal/c/)",
              value: getValue("profile", "portal", profile.portal),
              type: "string",
            },
          ],
        },
        {
          title: "Device",
          options: [
            {
              tag: "profile",
              name: "submodel",
              title: "Device model",
              value: getValue("profile", "submodel", profile.submodel),
              type: "select",
              options: {
                MAG250: "MAG 250",
                MAG255: "MAG 255",
                MAG256: "MAG 256",
                MAG275: "MAG 275",
                AuraHD: "Aura HD",
              },
            },
            {
              tag: "mag",
              name: "serial_number",
              title: "Serial number",
              comment: "Device serial number (leave empty for auto-generate)",
              value: getValue("mag", "serial_number", ""),
              type: "string",
            },
            {
              tag: "mag",
              name: "mac_address",
              title: "MAC address",
              comment: "Device MAC address (leave empty for auto-generate)",
              value: getValue("mag", "mac_address", "00:1A:79:00:00:01"),
              type: "string",
            },
          ],
        },
        {
          title: "Network",
          options: [
            {
              tag: "network",
              name: "use_multicast_proxy",
              title: "Use multicast proxy",
              value: getValue("network", "use_multicast_proxy", "false"),
              type: "bool",
            },
            {
              tag: "network",
              name: "multicast_proxy_url",
              title: "Multicast proxy URL",
              comment: "e.g. http://192.168.1.1:4022/udp/",
              value: getValue("network", "multicast_proxy_url", ""),
              type: "string",
            },
          ],
        },
        {
          title: "Media",
          options: [
            {
              tag: "media",
              name: "aspect_ratio",
              title: "Aspect ratio",
              value: getValue("media", "aspect_ratio", "auto"),
              type: "select",
              options: {
                auto: "Auto",
                "4:3": "4:3",
                "16:9": "16:9",
                fill: "Fill",
              },
            },
          ],
        },
      ],
    };
  }

  if (classId === "dunehd" || classId === "dunehd-api") {
    return {
      groups: [
        {
          title: "Profile",
          options: [
            {
              tag: "profile",
              name: "name",
              title: "Profile name",
              value: getValue("profile", "name", profile.name),
              type: "string",
            },
            {
              tag: "profile",
              name: "portal",
              title: "Portal URL",
              value: getValue("profile", "portal", profile.portal),
              type: "string",
            },
          ],
        },
        {
          title: "Device",
          options: [
            {
              tag: "profile",
              name: "submodel",
              title: "Device model",
              value: getValue("profile", "submodel", profile.submodel),
              type: "select",
              options: {
                "Dune HD TV-102": "Dune HD TV-102",
                "Dune HD Connect": "Dune HD Connect",
              },
            },
          ],
        },
      ],
    };
  }

  if (classId === "samsung") {
    return {
      groups: [
        {
          title: "Profile",
          options: [
            {
              tag: "profile",
              name: "name",
              title: "Profile name",
              value: getValue("profile", "name", profile.name),
              type: "string",
            },
            {
              tag: "profile",
              name: "portal",
              title: "Portal URL",
              value: getValue("profile", "portal", profile.portal),
              type: "string",
            },
          ],
        },
        {
          title: "Device",
          options: [
            {
              tag: "profile",
              name: "submodel",
              title: "Device model",
              value: getValue("profile", "submodel", profile.submodel),
              type: "select",
              options: {
                "Samsung SmartTV 2015": "Samsung SmartTV 2015",
                "Samsung SmartTV 2016": "Samsung SmartTV 2016",
                "Samsung SmartTV Tizen": "Samsung SmartTV Tizen",
              },
            },
            {
              tag: "samsung",
              name: "tizen_version",
              title: "Tizen version",
              comment: "SmartTV platform API version (e.g. 2.3, 3.0, 5.0)",
              value: getValue("samsung", "tizen_version", "2.3"),
              type: "string",
            },
          ],
        },
      ],
    };
  }

  return {
    groups: [
      {
        title: "Profile",
        options: [
          {
            tag: "profile",
            name: "name",
            title: "Profile name",
            value: getValue("profile", "name", profile.name),
            type: "string",
          },
          {
            tag: "profile",
            name: "portal",
            title: "Portal URL",
            value: getValue("profile", "portal", profile.portal),
            type: "string",
          },
        ],
      },
    ],
  };
}
