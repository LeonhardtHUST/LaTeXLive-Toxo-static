/**
 * Texo OCR Web Worker
 * Runs Transformers.js + ONNX Runtime Web for local LaTeX OCR inference.
 * Uses remoteHost mode to point Transformers.js at locally-served model files.
 */

const TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.5/+esm';

const UNIMERNET_MEAN = 0.7931;
const UNIMERNET_STD = 0.1738;

let model = null;
let tokenizer = null;
let isInitialized = false;
let TF = null;

async function loadTransformers() {
  if (TF) return TF;
  TF = await import(TRANSFORMERS_CDN);
  TF.env.allowLocalModels = false;
  if (TF.env.backends && TF.env.backends.onnx && TF.env.backends.onnx.wasm) {
    TF.env.backends.onnx.wasm.proxy = true;
  }
  return TF;
}

/* ── Image preprocessing (raw OffscreenCanvas, no image-js) ── */

async function blobToGreyPixels(blob) {
  const img = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = new Uint8Array(canvas.width * canvas.height);
  const data = imageData.data;
  for (let i = 0; i < pixels.length; i++) {
    pixels[i] = Math.round(0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]);
  }
  return { pixels, width: canvas.width, height: canvas.height };
}

function reverseColor(pixels) {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < pixels.length; i++) histogram[pixels[i]]++;
  const threshold = 200;
  let blackPixels = 0, whitePixels = 0;
  for (let i = 0; i < threshold; i++) blackPixels += histogram[i];
  for (let i = threshold; i < 256; i++) whitePixels += histogram[i];
  if (blackPixels >= whitePixels) {
    for (let i = 0; i < pixels.length; i++) pixels[i] = 255 - pixels[i];
  }
}

function cropMargin(pixels, width, height) {
  let min = 255, max = 0;
  for (let i = 0; i < pixels.length; i++) {
    if (pixels[i] < min) min = pixels[i];
    if (pixels[i] > max) max = pixels[i];
  }
  if (max === min) return { data: pixels, width, height };

  const threshold = 200;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const normalized = ((pixels[idx] - min) / (max - min)) * 255;
      if (normalized < threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < minX || maxY < minY) return { data: pixels, width, height };

  const newWidth = maxX - minX + 1;
  const newHeight = maxY - minY + 1;
  const result = new Uint8Array(newWidth * newHeight);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      result[(y - minY) * newWidth + (x - minX)] = pixels[y * width + x];
    }
  }
  return { data: result, width: newWidth, height: newHeight };
}

function pixelsToImageData(pixels, width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const v = pixels[i];
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  return new ImageData(data, width, height);
}

function resize(pixels, width, height, targetW, targetH) {
  const minDim = Math.min(targetH, targetW);
  const scale = minDim / Math.min(height, width);
  let newW = Math.round(width * scale);
  let newH = Math.round(height * scale);
  if (newW > targetW || newH > targetH) {
    const ratio = Math.min(targetW / newW, targetH / newH);
    newW = Math.round(newW * ratio);
    newH = Math.round(newH * ratio);
  }
  const srcCanvas = new OffscreenCanvas(width, height);
  const srcCtx = srcCanvas.getContext('2d');
  srcCtx.putImageData(pixelsToImageData(pixels, width, height), 0, 0);

  const resizedCanvas = new OffscreenCanvas(newW, newH);
  const resizedCtx = resizedCanvas.getContext('2d');
  resizedCtx.drawImage(srcCanvas, 0, 0, width, height, 0, 0, newW, newH);

  const padW = Math.floor((targetW - newW) / 2);
  const padH = Math.floor((targetH - newH) / 2);

  const output = new OffscreenCanvas(targetW, targetH);
  const outCtx = output.getContext('2d');
  outCtx.fillStyle = 'black';
  outCtx.fillRect(0, 0, targetW, targetH);
  outCtx.drawImage(resizedCanvas, padW, padH);

  const outData = outCtx.getImageData(0, 0, targetW, targetH);
  const result = new Uint8Array(targetW * targetH);
  for (let i = 0; i < targetW * targetH; i++) result[i] = outData.data[i * 4];
  return result;
}

function normalize(pixels) {
  const result = new Float32Array(pixels.length);
  for (let i = 0; i < pixels.length; i++) {
    result[i] = (pixels[i] / 255.0 - UNIMERNET_MEAN) / UNIMERNET_STD;
  }
  return result;
}

async function preprocessImg(blob) {
  let { pixels, width, height } = await blobToGreyPixels(blob);
  reverseColor(pixels);
  const cropped = cropMargin(pixels, width, height);
  const resized = resize(cropped.data, cropped.width, cropped.height, 384, 384);
  const array = normalize(resized);
  return array;
}

/* ── Init & Predict ── */

async function init(modelBaseUrl) {
  if (isInitialized) return;
  const t = await loadTransformers();

  // Parse modelBaseUrl (e.g. "https://4.toolbox.li3age.top/LaTeXLive/models") into
  // remoteHost and remotePathTemplate so Transformers.js constructs correct URLs:
  //   ${remoteHost}/${remotePathTemplate}/config.json
  var u = new URL(modelBaseUrl);
  t.env.remoteHost = u.origin + '/';
  t.env.remotePathTemplate = u.pathname.replace(/^\//, '') + '/{model}';

  model = await t.VisionEncoderDecoderModel.from_pretrained('_', {
    dtype: 'fp32',
    session_options: { logSeverityLevel: 3 },
    progress_callback: function (data) {
      self.postMessage({ type: 'progress', data: data });
    }
  });
  tokenizer = await t.PreTrainedTokenizer.from_pretrained('_');
  isInitialized = true;
}

async function predict(blob) {
  const array = await preprocessImg(blob);
  const t = await loadTransformers();
  const tensor = new t.Tensor('float32', array, [1, 1, 384, 384]);
  const pixelValues = t.cat([tensor, tensor, tensor], 1);
  const outputs = await model.generate({ inputs: pixelValues });
  const text = tokenizer.batch_decode(outputs, { skip_special_tokens: true })[0];
  return text;
}

/* ── Message handler ── */

self.onmessage = async function (e) {
  const { id, type, data } = e.data;

  if (type === 'init') {
    try {
      await init(data.modelPath);
      self.postMessage({ id: id, type: 'ready' });
    } catch (err) {
      self.postMessage({ id: id, type: 'error', error: err.message || 'Model init failed' });
    }
  } else if (type === 'recognize') {
    try {
      const blob = new Blob([data.buffer], { type: data.mime || 'image/png' });
      const text = await predict(blob);
      self.postMessage({ id: id, type: 'result', text: text });
    } catch (err) {
      self.postMessage({ id: id, type: 'error', error: err.message || 'OCR failed' });
    }
  }
};
