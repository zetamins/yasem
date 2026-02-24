export interface DuneApiState {
  deviceModel: string;
  firmwareVersion: string;
  playerUrl: string;
  isPlaying: boolean;
}

const DEFAULT_STATE: DuneApiState = {
  deviceModel: "Dune HD TV-102",
  firmwareVersion: "130516_2058_r5",
  playerUrl: "",
  isPlaying: false,
};

export function buildDuneApiScript(
  state: DuneApiState,
  profileConfig: Record<string, string>
): string {
  const deviceModel = profileConfig["profile/submodel"] || state.deviceModel;
  const firmwareVersion = state.firmwareVersion;

  return `
(function() {
  'use strict';

  var _state = {
    playerUrl: '',
    isPlaying: false,
    volume: 100,
    muted: false,
    position: 0,
    duration: 0
  };

  function _getPlayer() {
    return document.getElementById('yasem-player');
  }

  function _triggerEvent(name, data) {
    window.dispatchEvent(new CustomEvent('yasem:' + name, { detail: data }));
  }

  var DuneAPI = {
    version: function() { return '1.0'; },
    getVersion: function() { return '1.0'; },
    getFirmwareVersion: function() { return '${firmwareVersion}'; },
    getProductId: function() { return '${deviceModel.replace(/\s/g, "_")}'; },
    getSerialNumber: function() { return 'DUNE0000000001'; },
    getMacAddress: function() { return '00:22:33:44:55:66'; },

    launchMediaURL: function(url, startTime) {
      var p = _getPlayer();
      if (p) {
        p.src = url || '';
        if (startTime) p.currentTime = startTime;
        p.play().catch(function(e) { console.warn('[Dune] play error:', e); });
        _state.playerUrl = url;
        _state.isPlaying = true;
        _triggerEvent('mediaStarted', { url: url });
      }
    },

    stopPlayback: function() {
      var p = _getPlayer();
      if (p) {
        p.pause();
        p.src = '';
      }
      _state.isPlaying = false;
      _triggerEvent('mediaStopped', {});
    },

    isPlaying: function() {
      var p = _getPlayer();
      return p ? !p.paused && !p.ended : false;
    },

    getVolume: function() { return _state.volume; },
    setVolume: function(vol) {
      _state.volume = vol;
      var p = _getPlayer();
      if (p) p.volume = vol / 100;
    },

    getMute: function() { return _state.muted; },
    setMute: function(mute) {
      _state.muted = !!mute;
      var p = _getPlayer();
      if (p) p.muted = _state.muted;
    },

    getPlaybackPosition: function() {
      var p = _getPlayer();
      return p ? Math.floor(p.currentTime) : 0;
    },

    getPlaybackDuration: function() {
      var p = _getPlayer();
      return p ? Math.floor(p.duration || 0) : 0;
    },

    seekTo: function(seconds) {
      var p = _getPlayer();
      if (p) p.currentTime = seconds;
    },

    setFullscreen: function(enable) {
      if (enable) {
        document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen && document.exitFullscreen();
      }
    },

    exit: function() {
      window.history.back();
    },

    openURL: function(url) {
      if (url) window.location.href = url;
    }
  };

  window.DuneAPI = DuneAPI;

  window.Dune = {
    media: {
      play: function(url) { DuneAPI.launchMediaURL(url); },
      stop: function() { DuneAPI.stopPlayback(); },
      isPlaying: function() { return DuneAPI.isPlaying(); }
    },
    system: {
      getModel: function() { return '${deviceModel}'; },
      getFirmware: function() { return '${firmwareVersion}'; }
    }
  };

})();
`;
}

export function getDefaultDuneState(
  profileConfig: Record<string, string>
): DuneApiState {
  return {
    ...DEFAULT_STATE,
    deviceModel: profileConfig["profile/submodel"] || DEFAULT_STATE.deviceModel,
  };
}
