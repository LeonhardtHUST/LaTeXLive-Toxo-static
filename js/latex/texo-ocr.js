/**
 * Texo OCR - main thread wrapper
 * Manages a Web Worker that runs the Texo LaTeX OCR model in the browser.
 */
var texoOCR = {
  worker: null,
  ready: false,
  pendingRequests: {},
  requestId: 0,
  onProgress: null,

  /**
   * Initialize the OCR model.
   * @param {string} [basePath=''] - base URL path (e.g. '/LaTeXLive' in production, '' in dev)
   * @returns {Promise<void>}
   */
  init: function (basePath) {
    basePath = basePath || '';
    var modelPath = basePath + '/models';
    var workerUrl = basePath + '/js/latex/texo-ocr-worker.js';
    var self = this;
    return new Promise(function (resolve, reject) {
      try {
        self.worker = new Worker(workerUrl, { type: 'module' });
      } catch (err) {
        reject(new Error('Web Worker not supported or file not found: ' + err.message));
        return;
      }

      self.worker.onmessage = function (e) {
        var msg = e.data;

        if (msg.type === 'ready') {
          self.ready = true;
          resolve();
        } else if (msg.type === 'progress') {
          if (self.onProgress) self.onProgress(msg.data);
        } else if (msg.type === 'result') {
          var pending = self.pendingRequests[msg.id];
          if (pending) {
            pending.resolve(msg.text);
            delete self.pendingRequests[msg.id];
          }
        } else if (msg.type === 'error') {
          var pendingErr = self.pendingRequests[msg.id];
          if (pendingErr) {
            pendingErr.reject(new Error(msg.error));
            delete self.pendingRequests[msg.id];
          } else if (typeof msg.id === 'undefined' || msg.id === 0) {
            reject(new Error(msg.error));
          }
        }
      };

      self.worker.onerror = function (err) {
        reject(new Error('Worker error: ' + (err.message || 'unknown')));
      };

      self.worker.postMessage({ id: 0, type: 'init', data: { modelPath: modelPath } });
    });
  },

  /**
   * Recognize LaTeX from a base64 image.
   * @param {string} base64 - base64 data URI (e.g. "data:image/png;base64,...")
   * @returns {Promise<string>} - the recognized LaTeX code
   */
  recognize: function (base64) {
    var self = this;
    return new Promise(function (resolve, reject) {
      if (!self.ready) {
        reject(new Error('OCR model not initialized'));
        return;
      }

      var id = ++self.requestId;
      self.pendingRequests[id] = { resolve: resolve, reject: reject };

      var mime = 'image/png';
      var base64Data = base64;
      if (base64.indexOf(',') !== -1) {
        var parts = base64.split(',');
        var match = parts[0].match(/:(.*?);/);
        if (match) mime = match[1];
        base64Data = parts[1];
      }

      try {
        var binaryStr = atob(base64Data);
        var bytes = new Uint8Array(binaryStr.length);
        for (var i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        self.worker.postMessage(
          { id: id, type: 'recognize', data: { buffer: bytes.buffer, mime: mime } },
          [bytes.buffer]
        );
      } catch (err) {
        delete self.pendingRequests[id];
        reject(err);
      }
    });
  }
};

export { texoOCR };
