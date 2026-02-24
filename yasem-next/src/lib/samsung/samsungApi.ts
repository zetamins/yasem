export interface SamsungApiState {
  deviceModel: string;
  firmwareVersion: string;
  tizenVersion: string;
}

const DEFAULT_STATE: SamsungApiState = {
  deviceModel: "Samsung SmartTV 2015",
  firmwareVersion: "T-HKMAKUC-1252.3",
  tizenVersion: "2.3",
};

export function buildSamsungApiScript(
  state: SamsungApiState,
  profileConfig: Record<string, string>
): string {
  const deviceModel = profileConfig["profile/submodel"] || state.deviceModel;
  const tizenVersion = profileConfig["samsung/tizen_version"] || state.tizenVersion;
  const firmwareVersion = state.firmwareVersion;

  return `
(function() {
  'use strict';

  function _getPlayer() {
    return document.getElementById('yasem-player');
  }

  function _triggerEvent(name, data) {
    window.dispatchEvent(new CustomEvent('yasem:' + name, { detail: data }));
  }

  var _avplay = {
    _url: '',
    _state: 'NONE',
    _listeners: {},

    open: function(url) {
      this._url = url;
      this._state = 'IDLE';
    },
    close: function() {
      var p = _getPlayer();
      if (p) { p.pause(); p.src = ''; }
      this._state = 'NONE';
      _triggerEvent('mediaStopped', {});
    },
    prepare: function() {
      var p = _getPlayer();
      if (p && this._url) { p.src = this._url; p.load(); }
      this._state = 'READY';
    },
    prepareAsync: function(successCb, errorCb) {
      try {
        this.prepare();
        if (typeof successCb === 'function') successCb();
      } catch(e) {
        if (typeof errorCb === 'function') errorCb(e);
      }
    },
    play: function() {
      var p = _getPlayer();
      if (p) {
        p.play().catch(function(e) { console.warn('[Samsung] play error:', e); });
        _triggerEvent('mediaStarted', { url: this._url });
      }
      this._state = 'PLAYING';
    },
    pause: function() {
      var p = _getPlayer();
      if (p) p.pause();
      this._state = 'PAUSED';
      _triggerEvent('mediaPaused', {});
    },
    stop: function() {
      var p = _getPlayer();
      if (p) { p.pause(); p.currentTime = 0; }
      this._state = 'IDLE';
      _triggerEvent('mediaStopped', {});
    },
    jumpForward: function(ms) {
      var p = _getPlayer();
      if (p) p.currentTime += ms / 1000;
    },
    jumpBackward: function(ms) {
      var p = _getPlayer();
      if (p) p.currentTime = Math.max(0, p.currentTime - ms / 1000);
    },
    seekTo: function(ms) {
      var p = _getPlayer();
      if (p) p.currentTime = ms / 1000;
    },
    getState: function() { return this._state; },
    getCurrentTime: function() {
      var p = _getPlayer();
      return p ? Math.floor(p.currentTime * 1000) : 0;
    },
    getDuration: function() {
      var p = _getPlayer();
      return p ? Math.floor((p.duration || 0) * 1000) : 0;
    },
    setVolume: function(vol) {
      var p = _getPlayer();
      if (p) p.volume = Math.max(0, Math.min(1, vol / 100));
    },
    getVolume: function() {
      var p = _getPlayer();
      return p ? Math.round(p.volume * 100) : 100;
    },
    setMute: function(mute) {
      var p = _getPlayer();
      if (p) p.muted = !!mute;
    },
    getMute: function() {
      var p = _getPlayer();
      return p ? p.muted : false;
    },
    setSpeed: function(speed) {
      var p = _getPlayer();
      if (p) p.playbackRate = speed;
    },
    setDisplayRect: function(x, y, w, h) {},
    setDisplayMethod: function(method) {},
    setDisplayRotation: function(rotation) {},
    setStreamingProperty: function(prop, val) {},
    getStreamingProperty: function(prop) { return ''; },
    setSoundAnalysisListener: function(cb) {},
    setListener: function(listeners) {
      this._listeners = listeners || {};
    },
    getTotalTrackInfo: function() { return []; },
    getCurrentTrackInfo: function() { return null; },
    setSelectTrack: function(type, index) {}
  };

  var webapis = {
    avplay: _avplay,

    tv: {
      channel: {
        getCurrentChannel: function() {
          return { channelName: '', channelNumber: 0, programTitle: '' };
        },
        tune: function(channelInfo, successCb, errorCb) {
          if (typeof errorCb === 'function') errorCb({ name: 'NotSupportedError' });
        }
      },
      displaycontrol: {
        getDisplayResolution: function() { return '1920x1080'; },
        getSupportedResolutions: function() { return ['1920x1080', '1280x720']; }
      },
      inputdevice: {
        getSupportedKeys: function() { return []; },
        registerKey: function(name) {},
        unregisterKey: function(name) {}
      }
    },

    network: {
      getActiveConnectionType: function() { return 1; },
      getIp: function() { return '192.168.1.100'; },
      getMac: function() { return '00:11:22:33:44:55'; },
      getGateway: function() { return '192.168.1.1'; },
      getDns: function() { return '8.8.8.8'; },
      isConnectedToGateway: function() { return true; }
    },

    productinfo: {
      getModel: function() { return '${deviceModel}'; },
      getFirmwareVersion: function() { return '${firmwareVersion}'; },
      getDuid: function() { return 'SAMSUNG0000000001'; },
      getSmartTVServerVersion: function() { return '${tizenVersion}'; },
      isUdPanelSupported: function() { return false; },
      getRealModel: function() { return '${deviceModel}'; },
      getLocalSet: function() { return 'EUR'; },
      getSystemConfig: function(key) { return ''; }
    },

    appcommon: {
      setScreenSaver: function(timeout) {}
    },

    billing: {
      isServiceAvailable: function() { return false; }
    }
  };

  window.webapis = webapis;

  window.tizen = {
    application: {
      getCurrentApplication: function() {
        return {
          exit: function() { window.history.back(); },
          hide: function() {},
          getRequestedAppControl: function() { return null; }
        };
      },
      launchAppControl: function(appControl, id, successCb, errorCb) {
        if (typeof errorCb === 'function') errorCb({ name: 'NotSupportedError' });
      }
    },
    systeminfo: {
      getPropertyValue: function(prop, successCb, errorCb) {
        var result = {};
        if (prop === 'DISPLAY') result = { resolutionWidth: 1920, resolutionHeight: 1080 };
        if (prop === 'NETWORK') result = { networkType: 'ETHERNET' };
        if (typeof successCb === 'function') successCb(result);
      }
    },
    filesystem: {
      resolve: function(loc, successCb, errorCb) {
        if (typeof errorCb === 'function') errorCb({ name: 'NotSupportedError' });
      }
    }
  };

  var sf = {
    service: {
      WidgetAPI: {
        sendReadyEvent: function() {}
      }
    }
  };
  window.sf = sf;

})();
`;
}

export function getDefaultSamsungState(
  profileConfig: Record<string, string>
): SamsungApiState {
  return {
    ...DEFAULT_STATE,
    deviceModel: profileConfig["profile/submodel"] || DEFAULT_STATE.deviceModel,
    tizenVersion: profileConfig["samsung/tizen_version"] || DEFAULT_STATE.tizenVersion,
  };
}
