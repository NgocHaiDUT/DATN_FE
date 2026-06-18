// Face detection utilities using MediaPipe
import { FaceLandmarks } from "@/types/makeup.types";
import { 
  FEATURE_CONFIGS, 
  FeatureName, 
  FACE_ANALYSIS_INDICES,
  SkinToneType,
  FaceShapeType,
  LipShapeType,
  type FeatureConfig 
} from "@/lib/faceFeatures";

declare global {
  interface Window {
    FaceMesh?: any;
    Camera?: any;
  }
}

type NormalizedLandmark = {
  x: number;
  y: number;
  z: number;
}

type NormalizedLandmarkList = NormalizedLandmark[];

export const loadMediaPipeScripts = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.FaceMesh && window.Camera) {
      resolve();
      return;
    }

    const scripts = [
      "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
      "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js",
    ];

    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded === scripts.length) {
        resolve();
      }
    };

    scripts.forEach((src) => {
      const script = document.createElement("script");
      script.src = src;
      script.crossOrigin = "anonymous";
      script.onload = onLoad;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  });
};

// Face mesh landmark indices for makeup application
export const FACE_LANDMARKS = {
  LIPS_UPPER: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
  LIPS_LOWER: [146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
  LIPS_OUTER: [
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0,
    37, 39, 40, 185,
  ],
  LEFT_EYE: [
    33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161,
    246,
  ],
  RIGHT_EYE: [
    362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384,
    398,
  ],
  LEFT_EYEBROW: [70, 63, 105, 66, 107, 55, 65, 52, 53, 46],
  RIGHT_EYEBROW: [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
  LEFT_CHEEK: [205, 50, 117, 118, 101, 36, 205],
  RIGHT_CHEEK: [425, 280, 346, 347, 330, 266, 425],
  FACE_OVAL: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379,
    378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127,
    162, 21, 54, 103, 67, 109,
  ],
};

export const extractFaceLandmarks = (results: any): FaceLandmarks | null => {
  if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
    return null;
  }

  const landmarks = results.multiFaceLandmarks[0];

  return {
    lips: FACE_LANDMARKS.LIPS_OUTER.map((idx) => landmarks[idx]),
    leftEye: FACE_LANDMARKS.LEFT_EYE.map((idx) => landmarks[idx]),
    rightEye: FACE_LANDMARKS.RIGHT_EYE.map((idx) => landmarks[idx]),
    leftCheek: FACE_LANDMARKS.LEFT_CHEEK.map((idx) => landmarks[idx]),
    rightCheek: FACE_LANDMARKS.RIGHT_CHEEK.map((idx) => landmarks[idx]),
  };
};

import {
  drawFeature,
  drawEyebrow,
  drawMascara,
  drawEyeliner,
  drawBlush,
  drawFoundation,
  hexToRgb
} from './makeup-drawing';

// Feature sets for special handling
const BLUSH_FEATURES: ReadonlySet<FeatureName> = new Set(['BLUSH_LEFT', 'BLUSH_RIGHT'])
const EYEBROW_FEATURES: ReadonlySet<FeatureName> = new Set(['EYEBROW_LEFT', 'EYEBROW_RIGHT'])
const MASCARA_FEATURES: ReadonlySet<FeatureName> = new Set(['MASCARA_LEFT', 'MASCARA_RIGHT'])
const EYELINER_FEATURES: ReadonlySet<FeatureName> = new Set(['EYELINER_LEFT', 'EYELINER_RIGHT'])

// Type for feature state
export type FeatureState = {
  enabled: boolean
  color: string
  alpha: number
}

export type FeatureStateMap = Record<FeatureName, FeatureState>

// Draw makeup with feature configs
export const drawMakeupWithFeatures = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  featureSettings: FeatureStateMap
) => {
  FEATURE_CONFIGS.forEach(({ name, indices }) => {
    const settings = featureSettings[name]
    if (!settings?.enabled) return

    const rgb = hexToRgb(settings.color)

    if (name === 'FOUNDATION') {
      drawFoundation(ctx, landmarks, indices, width, height, rgb, settings.alpha)
      return
    }

    if (BLUSH_FEATURES.has(name)) {
      drawBlush(ctx, landmarks, indices, width, height, rgb, settings.alpha)
      return
    }

    if (EYEBROW_FEATURES.has(name)) {
      const isLeft = name === 'EYEBROW_LEFT'
      drawEyebrow(ctx, landmarks, indices, width, height, rgb, settings.alpha, isLeft)
      return
    }

    if (MASCARA_FEATURES.has(name)) {
      const isLeft = name === 'MASCARA_LEFT'
      drawMascara(ctx, landmarks, indices, width, height, rgb, settings.alpha, isLeft)
      return
    }

    if (EYELINER_FEATURES.has(name)) {
      const isLeft = name === 'EYELINER_LEFT'
      drawEyeliner(ctx, landmarks, width, height, rgb, settings.alpha, isLeft)
      return
    }

    drawFeature(ctx, landmarks, indices, width, height, rgb, settings.alpha)
  })
}

// Legacy function for backward compatibility with VirtualMakeup.tsx
export const drawMakeup = (
  ctx: CanvasRenderingContext2D,
  landmarks: FaceLandmarks,
  makeup: {
    lipstick?: { color: string; opacity: number };
    eyeshadow?: { color: string; opacity: number };
    blush?: { color: string; opacity: number };
  }
) => {
  const canvas = ctx.canvas;

  // Helper to convert normalized coordinates to canvas coordinates
  const toCanvasCoords = (point: { x: number; y: number }) => ({
    x: point.x * canvas.width,
    y: point.y * canvas.height,
  });

  // Draw lipstick
  if (makeup.lipstick && landmarks.lips) {
    ctx.save();
    ctx.globalAlpha = makeup.lipstick.opacity;
    ctx.fillStyle = makeup.lipstick.color;
    ctx.beginPath();
    landmarks.lips.forEach((point: any, index: number) => {
      const coords = toCanvasCoords(point);
      if (index === 0) {
        ctx.moveTo(coords.x, coords.y);
      } else {
        ctx.lineTo(coords.x, coords.y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Draw eyeshadow
  if (makeup.eyeshadow && landmarks.leftEye && landmarks.rightEye) {
    ctx.save();
    ctx.globalAlpha = makeup.eyeshadow.opacity;
    ctx.fillStyle = makeup.eyeshadow.color;

    // Left eye
    ctx.beginPath();
    landmarks.leftEye.forEach((point: any, index: number) => {
      const coords = toCanvasCoords(point);
      if (index === 0) {
        ctx.moveTo(coords.x, coords.y);
      } else {
        ctx.lineTo(coords.x, coords.y);
      }
    });
    ctx.closePath();
    ctx.fill();

    // Right eye
    ctx.beginPath();
    landmarks.rightEye.forEach((point: any, index: number) => {
      const coords = toCanvasCoords(point);
      if (index === 0) {
        ctx.moveTo(coords.x, coords.y);
      } else {
        ctx.lineTo(coords.x, coords.y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Draw blush
  if (makeup.blush && landmarks.leftCheek && landmarks.rightCheek) {
    ctx.save();
    ctx.globalAlpha = makeup.blush.opacity;
    ctx.fillStyle = makeup.blush.color;

    // Left cheek
    ctx.beginPath();
    landmarks.leftCheek.forEach((point: any, index: number) => {
      const coords = toCanvasCoords(point);
      if (index === 0) {
        ctx.moveTo(coords.x, coords.y);
      } else {
        ctx.lineTo(coords.x, coords.y);
      }
    });
    ctx.closePath();
    ctx.fill();

    // Right cheek
    ctx.beginPath();
    landmarks.rightCheek.forEach((point: any, index: number) => {
      const coords = toCanvasCoords(point);
      if (index === 0) {
        ctx.moveTo(coords.x, coords.y);
      } else {
        ctx.lineTo(coords.x, coords.y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
};
