export type StbType = "mag" | "dunehd" | "samsung" | "web-gui";

export type AspectRatio =
  | "auto"
  | "1:1"
  | "5:4"
  | "4:3"
  | "16:9"
  | "16:10"
  | "fill"
  | "expanding";

export type MediaPlayingState = "stopped" | "playing" | "paused";

export type MediaStatus =
  | "unknown"
  | "no-media"
  | "loading"
  | "loaded"
  | "stalled"
  | "buffering"
  | "buffered"
  | "end-of-media"
  | "invalid"
  | "video-info-received"
  | "media-info-received";

export type RcKey =
  | "OK"
  | "RIGHT"
  | "LEFT"
  | "UP"
  | "DOWN"
  | "PAGE_UP"
  | "PAGE_DOWN"
  | "MENU"
  | "BACK"
  | "REFRESH"
  | "RED"
  | "GREEN"
  | "YELLOW"
  | "BLUE"
  | "CHANNEL_PLUS"
  | "CHANNEL_MINUS"
  | "SERVICE"
  | "TV"
  | "VOLUME_UP"
  | "VOLUME_DOWN"
  | "REWIND"
  | "FAST_FORWARD"
  | "STOP"
  | "PLAY_PAUSE"
  | "PLAY"
  | "PAUSE"
  | "REC"
  | "MUTE"
  | "POWER"
  | "INFO"
  | "EXIT"
  | "NUMBER_0"
  | "NUMBER_1"
  | "NUMBER_2"
  | "NUMBER_3"
  | "NUMBER_4"
  | "NUMBER_5"
  | "NUMBER_6"
  | "NUMBER_7"
  | "NUMBER_8"
  | "NUMBER_9";

export interface StbSubmodel {
  id: string;
  name: string;
  logo?: string;
}

export interface StbPluginDefinition {
  id: string;
  name: string;
  classId: string;
  submodels: StbSubmodel[];
}

export interface ProfileFlag {
  hidden?: boolean;
}

export interface Profile {
  id: string;
  name: string;
  classId: string;
  submodel: string;
  portal: string;
  image?: string;
  flags?: ProfileFlag;
  config: Record<string, string>;
}

export interface ConfigOption {
  tag: string;
  name: string;
  title: string;
  comment?: string;
  value: string;
  type: "string" | "int" | "bool" | "select";
  options?: Record<string, string>;
  defaultValue?: string;
}

export interface ConfigGroup {
  title: string;
  options: ConfigOption[];
}

export interface ProfileConfiguration {
  groups: ConfigGroup[];
}

export interface AppInfo {
  name: string;
  version: string;
  copyright: string;
}

export interface MediaInfo {
  container?: string;
  videoCodec?: string;
  audioCodec?: string;
  audioBitrate?: number;
  resolution?: { width: number; height: number };
  title?: string;
  language?: string;
}

export interface PlayerState {
  url: string;
  state: MediaPlayingState;
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  loop: number;
  aspectRatio: AspectRatio;
  brightness: number;
  contrast: number;
  saturation: number;
  audioPid: number;
  speed: number;
  buffering: number;
}

export interface PortalSession {
  profileId: string;
  url: string;
  userAgent?: string;
  startedAt: number;
}
