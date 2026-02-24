import { PlayerState, AspectRatio } from "@/types";

export interface GStbApiState {
  player: PlayerState;
  deviceModel: string;
  deviceSerial: string;
  deviceMac: string;
  deviceVendor: string;
  firmwareVersion: string;
  environmentVars: Record<string, string>;
  isPlaying: boolean;
  internalPortalActive: boolean;
  webMode: boolean;
  topWindow: number;
  chromaKey: number;
  alphaLevel: number;
  subtitlesEnabled: boolean;
  subtitlePid: number;
}

const DEFAULT_STATE: GStbApiState = {
  player: {
    url: "",
    state: "stopped",
    position: 0,
    duration: 0,
    volume: 100,
    muted: false,
    loop: 0,
    aspectRatio: "auto",
    brightness: 50,
    contrast: 50,
    saturation: 50,
    audioPid: 0,
    speed: 1,
    buffering: 0,
  },
  deviceModel: "MAG250",
  deviceSerial: "DEADBEEF00001",
  deviceMac: "00:1A:79:00:00:01",
  deviceVendor: "Infomir",
  firmwareVersion: "2.18.18-r11-pub-250",
  environmentVars: {},
  isPlaying: false,
  internalPortalActive: false,
  webMode: false,
  topWindow: 0,
  chromaKey: 0x00100400,
  alphaLevel: 255,
  subtitlesEnabled: false,
  subtitlePid: 0,
};

export function buildGStbScript(
  state: GStbApiState,
  profileConfig: Record<string, string>
): string {
  const deviceModel = profileConfig["mag/submodel"] || profileConfig["profile/submodel"] || state.deviceModel;
  const macAddress = profileConfig["mag/mac_address"] || state.deviceMac;
  const serialNumber = profileConfig["mag/serial_number"] || state.deviceSerial;
  const useMulticastProxy = profileConfig["network/use_multicast_proxy"] === "true";
  const multicastProxyUrl = profileConfig["network/multicast_proxy_url"] || "";

  return `
(function() {
  'use strict';

  var _state = {
    playerUrl: '',
    playerState: 'stopped',
    position: 0,
    duration: 0,
    volume: ${state.player.volume},
    muted: ${state.player.muted},
    loop: 0,
    aspectRatio: '${state.player.aspectRatio}',
    brightness: ${state.player.brightness},
    contrast: ${state.player.contrast},
    saturation: ${state.player.saturation},
    audioPid: 0,
    speed: 1,
    buffering: 0,
    env: {},
    subtitlePid: 0,
    subtitlesEnabled: false,
    topWindow: 0,
    alphaLevel: 255,
    internalPortalActive: false
  };

  var _playerEl = null;
  var _callbacks = {};
  var _mediaCallbackInterval = null;

  function _getPlayer() {
    if (!_playerEl) {
      _playerEl = document.getElementById('yasem-player');
    }
    return _playerEl;
  }

  function _triggerEvent(name, data) {
    var event = new CustomEvent('yasem:' + name, { detail: data });
    window.dispatchEvent(event);
    // Also send to parent window for cross-frame communication
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ type: 'yasem:' + name, payload: data }, '*');
      } catch(e) {}
    }
    if (typeof window.stbEvent === 'function') {
      window.stbEvent(name, data);
    }
  }

  function _translateUrl(url) {
    if (!url) return url;
    ${useMulticastProxy ? `
    if (url.indexOf('udp://') === 0 || url.indexOf('rtp://') === 0) {
      var addr = url.replace('udp://', '').replace('rtp://', '');
      return '${multicastProxyUrl}' + addr;
    }
    ` : ''}
    return url;
  }

  function _startMediaCallbacks() {
    if (_mediaCallbackInterval) return;
    _mediaCallbackInterval = setInterval(function() {
      var player = _getPlayer();
      if (!player) return;
      _state.position = Math.floor((player.currentTime || 0) * 1000);
      _state.duration = Math.floor((player.duration || 0) * 1000);
      _state.buffering = Math.floor((player.buffered && player.buffered.length > 0
        ? (player.buffered.end(0) / (player.duration || 1)) * 100 : 0));
    }, 500);
  }

  function _stopMediaCallbacks() {
    if (_mediaCallbackInterval) {
      clearInterval(_mediaCallbackInterval);
      _mediaCallbackInterval = null;
    }
  }

  var gSTB = {

    CloseWebWindow: function() {
      window.close();
    },

    Continue: function() {
      var p = _getPlayer();
      if (p) {
        p.play();
        _state.playerState = 'playing';
        _triggerEvent('mediaPlaying', {});
      }
    },

    Debug: function(str) {
      console.log('[GStb]', str);
    },

    DeinitPlayer: function() {
      var p = _getPlayer();
      if (p) {
        p.pause();
        p.src = '';
        _state.playerState = 'stopped';
        _state.playerUrl = '';
      }
      _stopMediaCallbacks();
    },

    DeleteAllCookies: function() {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var name = cookies[i].split('=')[0].trim();
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      }
    },

    EnableAppButton: function(enable) {},
    EnableCustomNavigation: function(enable) {},
    EnableJavaScriptInterrupt: function(enable) {},
    EnableMulticastProxy: function(enable) {},
    EnableServiceButton: function(enable) {},
    EnableSetCookieFrom: function(domain, enable) {},
    EnableSpatialNavigation: function(enable) {},
    EnableVKButton: function(enable) {},
    EnableTvButton: function(enable) {},

    ExecAction: function(str) {
      console.log('[GStb] ExecAction:', str);
    },

    ExtProtocolCommand: function(val1, val2, val3) {
      console.log('[GStb] ExtProtocolCommand:', val1, val2, val3);
    },

    ForceHDMItoDVI: function(forceDVI) {},

    Get3DConversionMode: function() { return 0; },
    GetAlphaLevel: function() { return _state.alphaLevel; },
    GetAspect: function() { return 0; },

    GetAudioPID: function() { return _state.audioPid; },
    GetAudioPIDs: function() { return '0 0'; },
    GetAudioPIDsEx: function() { return JSON.stringify([{pid:0,type:'mp2',lang:'und'}]); },

    GetBrightness: function() { return _state.brightness; },
    GetBufferLoad: function() { return _state.buffering; },
    GetContrast: function() { return _state.contrast; },

    GetDeviceActiveBank: function() { return '1'; },
    GetDeviceImageDesc: function() { return '${deviceModel} firmware'; },
    GetDeviceImageVersion: function() { return '${state.firmwareVersion}'; },
    GetDeviceImageVersionCurrent: function() { return '${state.firmwareVersion}'; },
    GetDeviceMacAddress: function() { return '${macAddress}'; },
    GetDeviceModel: function() { return '${deviceModel}'; },
    GetDeviceModelExt: function() { return '${deviceModel}'; },
    GetDeviceSerialNumber: function() { return '${serialNumber}'; },
    GetDeviceVendor: function() { return '${state.deviceVendor}'; },
    GetDeviceVersionHardware: function() { return '2.0'; },

    GetEnv: function(name) { return _state.env[name] || ''; },

    GetExtProtocolList: function() { return ''; },
    GetLanLinkStatus: function() { return true; },

    GetMediaLen: function() { return Math.floor(_state.duration / 1000); },
    GetMediaLenEx: function() { return Math.floor(_state.duration / 1000); },

    GetMetadataInfo: function() {
      return JSON.stringify({
        title: '', author: '', studio: '', year: '', genre: '',
        poster_path: '', cat: '', description: '', age: '0'
      });
    },

    GetMicVolume: function() { return 0; },
    GetMute: function() { return _state.muted; },

    GetNetworkGateways: function() { return '192.168.1.1'; },
    GetNetworkNameServers: function() { return '8.8.8.8 8.8.4.4'; },
    GetNetworkWifiMac: function() { return '00:00:00:00:00:00'; },

    GetPIG: function() { return false; },

    GetPosPercent: function() {
      if (_state.duration <= 0) return 0;
      return Math.floor((_state.position / _state.duration) * 100);
    },
    GetPosPercentEx: function() { return gSTB.GetPosPercent(); },

    GetPosTime: function() { return Math.floor(_state.position / 1000); },
    GetPosTimeEx: function() { return Math.floor(_state.position / 1000); },

    GetPppoeIp: function() { return ''; },
    GetPppoeLinkStatus: function() { return false; },

    GetSaturation: function() { return _state.saturation; },

    GetSmbGroups: function() { return '[]'; },
    GetSmbServers: function(args) { return '[]'; },
    GetSmbShares: function(args) { return '[]'; },

    GetSpeed: function() { return 1; },

    GetStorageInfo: function(args) {
      return JSON.stringify([{name:'Internal',free:1073741824,total:8589934592}]);
    },

    GetSubtitlePID: function() { return _state.subtitlePid; },
    GetSubtitlePIDs: function() { return ''; },
    GetTeletextPID: function() { return ''; },
    GetTeletextPIDs: function() { return ''; },

    GetTransparentColor: function() { return 0x00100400; },

    GetVideoInfo: function() {
      var p = _getPlayer();
      var w = p ? (p.videoWidth || 0) : 0;
      var h = p ? (p.videoHeight || 0) : 0;
      return JSON.stringify({width:w,height:h,aspect:'16:9'});
    },

    GetVolume: function() { return _state.volume; },

    GetWepKey128ByPassPhrase: function(passPhrase) { return ''; },
    GetWepKey64ByPassPhrase: function(passPhrase) { return ''; },
    GetWifiGroups: function() { return '[]'; },
    GetWifiLinkStatus: function() { return false; },
    GetWifiLinkStatusEx: function() { return JSON.stringify({status:false}); },

    GetWinAlphaLevel: function(winNum) { return _state.alphaLevel; },

    HideVirtualKeyboard: function() {},
    HideVirtualKeyboardEx: function() {},

    IgnoreUpdates: function(ignore) {},

    InitPlayer: function() {
      var p = _getPlayer();
      if (!p) {
        console.warn('[GStb] Player element not found');
      }
      _startMediaCallbacks();
    },

    IsFileExist: function(fileName) { return false; },
    IsFolderExist: function(folderName) { return false; },

    IsInternalPortalActive: function() { return _state.internalPortalActive; },

    IsPlaying: function() {
      var p = _getPlayer();
      return p ? !p.paused && !p.ended : false;
    },

    IsVirtualKeyboardActive: function() { return false; },
    IsVirtualKeyboardActiveEx: function() { return false; },

    ListDir: function(dir, lastModified) {
      return 'var dirs = []; var files = [];';
    },

    LoadCASIniFile: function(iniFileName) {},
    LoadExternalSubtitles: function(url) {},

    LoadURL: function(str) {
      if (str) window.location.href = str;
    },

    LoadUserData: function(str) { return ''; },

    Pause: function() {
      var p = _getPlayer();
      if (p && !p.paused) {
        p.pause();
        _state.playerState = 'paused';
        _triggerEvent('mediaPaused', {});
      }
    },

    Play: function(playStr, proxyParams) {
      var url = _translateUrl(playStr || '');
      _state.playerUrl = url;
      _state.playerState = 'playing';
      _state.position = 0;
      var p = _getPlayer();
      if (p) {
        p.src = url;
        p.load();
        p.play().catch(function(err) {
          console.warn('[GStb] Play error:', err);
        });
        _startMediaCallbacks();
        _triggerEvent('mediaStarted', { url: url });
      } else {
        _triggerEvent('mediaStarted', { url: url });
      }
    },

    PlaySolution: function(solution, url) {
      gSTB.Play(url);
    },

    RDir: function(name) { return name; },
    ReadCFG: function() { return ''; },
    ResetUserFs: function() {},

    Rotate: function(angle) {},

    SaveUserData: function(fileName, data) {},

    SendEventToPortal: function(args) {
      _triggerEvent('portalEvent', { args: args });
    },

    ServiceControl: function(serviceName, action) {
      console.log('[GStb] ServiceControl:', serviceName, action);
    },

    Set3DConversionMode: function(mode) {},
    SetAdditionalCasParam: function(name, value) {},
    SetAlphaLevel: function(alpha) { _state.alphaLevel = alpha; },
    SetAspect: function(aspect) {},
    SetAudioLangs: function(priLang, secLang) {},
    SetAudioOperationalMode: function(mode) {},

    SetAudioPID: function(pid) {
      _state.audioPid = pid;
      var p = _getPlayer();
      if (p) {
        var tracks = p.audioTracks;
        if (tracks) {
          for (var i = 0; i < tracks.length; i++) {
            tracks[i].enabled = (i === pid);
          }
        }
      }
    },

    SetAutoFrameRate: function(mode) {},
    SetBrightness: function(bri) { _state.brightness = bri; },
    SetBufferSize: function(sizeInMs, maxSizeInBytes) {},
    SetCASDescrambling: function(isSoftware) {},
    SetCASParam: function(serverAddr, port, companyName, opID, errorLevel) {},
    SetCASType: function(type) {},
    SetCheckSSLCertificate: function(val) {},
    SetChromaKey: function(key, mask) {},
    SetComponentMode: function(mode) {},
    SetContrast: function(contrast) { _state.contrast = contrast; },
    SetCustomHeader: function(header) {},
    SetDefaultFlicker: function(state) {},
    SetDRC: function(high, low) {},

    SetEnv: function(data, value) {
      _state.env[data] = value || '';
      return true;
    },

    SetFlicker: function(state, flk, shp) {},
    SetHDMIAudioOut: function(type) {},
    SetInternalPortalActive: function(active) { _state.internalPortalActive = active; },
    SetListFilesExt: function(exts) {},

    SetLoop: function(loop) {
      _state.loop = loop;
      var p = _getPlayer();
      if (p) p.loop = loop !== 0;
    },

    SetMicVolume: function(volume) {},

    SetMode: function(mode) { return 0; },
    SetMulticastProxyURL: function(val) { return 0; },

    SetMute: function(mute) {
      _state.muted = mute !== 0;
      var p = _getPlayer();
      if (p) p.muted = _state.muted;
    },

    SetObjectCacheCapacities: function(cacheMinDeadCapacity, cacheMaxDead, totalCapacity) {},
    SetPCRModeEnabled: function(enable) {},
    SetPIG: function(state, scale, x, y) {},
    SetPixmapCacheSize: function(sizeKb) {},

    SetPosPercent: function(prc) {
      var p = _getPlayer();
      if (p && p.duration) {
        p.currentTime = (prc / 100) * p.duration;
      }
    },
    SetPosPercentEx: function(prc) { gSTB.SetPosPercent(prc); },

    SetPosTime: function(time) {
      var p = _getPlayer();
      if (p) p.currentTime = time;
    },
    SetPosTimeEx: function(time) { gSTB.SetPosTime(time); },

    SetSaturation: function(sat) { _state.saturation = sat; },

    SetSpeed: function(speed) {
      var p = _getPlayer();
      if (p) p.playbackRate = speed;
    },

    SetStereoMode: function(mode) {},
    SetSubtitleLangs: function(priLang, secLang) {},
    SetSubtitlePID: function(pid) { _state.subtitlePid = pid; },
    SetSubtitles: function(enable) { _state.subtitlesEnabled = enable; },
    SetSubtitlesColor: function(val) {},
    SetSubtitlesEncoding: function(encoding) {},
    SetSubtitlesFont: function(font) {},
    SetSubtitlesOffs: function(offset) {},
    SetSubtitlesSize: function(size) {},
    SetSyncCorrection: function(val1, val2) {},
    SetSyncOffsetCorrection: function(val) {},
    SetTeletext: function(val) {},
    SetTeletextPID: function(val) {},

    SetTopWin: function(winNum) {
      _state.topWindow = winNum;
      _triggerEvent('topWindowChanged', { winNum: winNum });
    },

    SetTransparentColor: function(color) {},
    SetupRTSP: function(type, flags) {},
    SetupSPdif: function(flags) {},
    SetUserFlickerControl: function(mode) {},
    SetVideoControl: function(mode) {},
    SetVideoState: function(state) {},

    SetViewport: function(xsize, ysize, x, y) {
      _triggerEvent('viewportChanged', {xsize:xsize,ysize:ysize,x:x,y:y});
    },

    SetViewportEx: function(xSize, ySize, xPos, yPos, clipXSize, clipYSize, clipXPos, clipYPos, saveClip) {
      _triggerEvent('viewportChanged', {xSize:xSize,ySize:ySize,xPos:xPos,yPos:yPos});
    },

    SetVolume: function(volume) {
      _state.volume = volume;
      var p = _getPlayer();
      if (p) p.volume = volume / 100;
    },

    SetWebMode: function(val, str) { _state.webMode = val; },

    SetWebProxy: function(host, port, user, password, exclude) {},
    ResetWebProxy: function() {},

    SetWinAlphaLevel: function(winNum, alpha) { _state.alphaLevel = alpha; },
    SetWinMode: function(winNum, mode) {},

    ShowSubtitle: function(start, end, text) {
      _triggerEvent('showSubtitle', {start:start,end:end,text:text});
    },

    ShowVideoImmediately: function(val) {},
    ShowVirtualKeyboard: function(show) {},
    HideVirtualKeyboard: function() {},

    StandBy: function(standBy) {},
    StartLocalCfg: function() {},
    Step: function() {},

    Stop: function() {
      var p = _getPlayer();
      if (p) {
        p.pause();
        p.currentTime = 0;
        p.src = '';
      }
      _state.playerState = 'stopped';
      _state.playerUrl = '';
      _stopMediaCallbacks();
      _triggerEvent('mediaStopped', {});
    },

    Version: function() { return '2.18.18-r11-pub-250'; },

    WriteCFG: function(cfg) {},
    WritePrefs: function(prefs) {},

    GetHashVersion1: function(secret, key) {
      return btoa(unescape(encodeURIComponent(secret + key)));
    },

    SetNativeStringMode: function(native) {},
    SetScreenSaverTime: function(time) {},
    SetInputLang: function(lang) {},
    GetDefaultUpdateUrl: function() { return ''; },
    SetUiLang: function(lang) {},
    GetInputLang: function() { return 'en'; },
    SetSettingsInitAttr: function(options) {},
    SetScreenSaverInitAttr: function(options) {},
    ClearStatistics: function() {},
    GetHDMIConnectionState: function() { return 1; },
    GetHLSInfo: function() { return JSON.stringify({}); },
    SetLedIndicatorMode: function(mode) {},
    SetLedIndicatorLevels: function(baseLevel, blinkLevel) {},
    GetLedIndicatorState: function() { return JSON.stringify({mode:0}); },
    GetStandByStatus: function() { return false; },
    GetStatistics: function() { return JSON.stringify({}); },
    GetTopWin: function() { return _state.topWindow; },
    IsFileUTF8Encoded: function(fileName) { return true; },
    SetSyslogLevel: function(level) {},

    ConfigNetRc: function(deviceName, password) {},
    SetNetRcStatus: function(enable) {},

    GetUID: function(arg1, arg2) {
      var mac = '${macAddress}'.replace(/:/g,'');
      if (arg1 && arg2) {
        return btoa(mac + arg1 + arg2).substring(0, 32);
      }
      if (arg1) {
        return btoa(mac + arg1).substring(0, 32);
      }
      return mac;
    }
  };

  window.gSTB = gSTB;

  var netscape = {
    security: {
      PrivilegeManager: {
        enablePrivilege: function() {}
      }
    }
  };
  window.netscape = netscape;

})();
`;
}

export function getDefaultState(): GStbApiState {
  return JSON.parse(JSON.stringify(DEFAULT_STATE)) as GStbApiState;
}
