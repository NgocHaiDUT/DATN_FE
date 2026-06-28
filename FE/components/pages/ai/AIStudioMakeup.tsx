'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, GitCompare, Loader2, ShoppingBag, ShoppingCart } from 'lucide-react'
import { useCart } from '@/features/shop/useCart'
import { useAuthStore } from '@/stores/auth.store'
import {
  FEATURE_CONFIGS,
  FEATURE_GROUPS,
  FACE_ANALYSIS_INDICES,
  SKIN_TONES,
  type FeatureGroupKey,
  type FeatureName,
  type SkinToneType,
  type FaceShapeType,
  type LipShapeType,
} from '@/lib/faceFeatures'
import type { MakeupProduct as Product, ProductVariant, Brand } from '@/services/makeup.service'
import { fetchProductsByCategories, fetchRecommendedProducts, fetchProductDetails, formatPrice, MOCK_BRANDS } from '@/services/makeup.service'
import { apiClient } from '@/lib/api'
import { resolveMediaUrl } from '@/lib/media'
import { ENDPOINTS } from '@/constants/endpoint'
import { VrReviewDialog } from '@/components/common/VrReviewDialog'
import { getVrReviewPromptStatus } from '@/lib/vr-review'
import {
  drawEyebrow,
  drawMascara,
  drawEyeliner,
  drawBlush,
  drawFoundation,
} from '@/lib/makeup-drawing'

// MediaPipe FaceMesh is loaded via CDN script in page.tsx
// Access it from window object to avoid Module.arguments error
const getFaceMeshClass = () => {
  if (typeof window === 'undefined') return null
  return (window as any).FaceMesh || null
}

// Suggested makeup colors based on skin tone
type SuggestedMakeup = {
  lips: { color: string; alpha: number; name: string };
  eyeshadow: { color: string; alpha: number; name: string };
  blush: { color: string; alpha: number; name: string };
  eyeliner: { color: string; alpha: number; name: string };
  eyebrows: { color: string; alpha: number; name: string };
  foundation: { color: string; alpha: number; name: string };
  mascara: { color: string; alpha: number; name: string };
};

const MAKEUP_SUGGESTIONS: Record<SkinToneType, SuggestedMakeup> = {
  fair: {
    lips: { color: '#E8747C', alpha: 0.6, name: 'Hồng đào nhẹ' },
    eyeshadow: { color: '#D4A5A5', alpha: 0.3, name: 'Hồng pastel' },
    blush: { color: '#FFB6C1', alpha: 0.25, name: 'Hồng baby' },
    eyeliner: { color: '#4A3728', alpha: 0.85, name: 'Nâu sô-cô-la' },
    eyebrows: { color: '#6B4423', alpha: 0.5, name: 'Nâu tự nhiên' },
    foundation: { color: '#FFE4C4', alpha: 0.28, name: 'Tông nền sáng be' },
    mascara: { color: '#2C1B10', alpha: 0.9, name: 'Nâu đen tự nhiên' },
  },
  light: {
    lips: { color: '#C54B6C', alpha: 0.65, name: 'Hồng berry' },
    eyeshadow: { color: '#9D7B6A', alpha: 0.32, name: 'Nâu ấm' },
    blush: { color: '#E8A4A4', alpha: 0.28, name: 'Hồng san hô' },
    eyeliner: { color: '#3D2B1F', alpha: 0.88, name: 'Nâu đậm' },
    eyebrows: { color: '#5C4033', alpha: 0.52, name: 'Nâu trung' },
    foundation: { color: '#F5DEB3', alpha: 0.3, name: 'Tông nền be sáng' },
    mascara: { color: '#1C1008', alpha: 0.92, name: 'Đen nâu' },
  },
  medium: {
    lips: { color: '#B5495B', alpha: 0.68, name: 'Hồng đất' },
    eyeshadow: { color: '#8B6B61', alpha: 0.35, name: 'Nâu đồng' },
    blush: { color: '#D4836A', alpha: 0.3, name: 'Cam đất' },
    eyeliner: { color: '#2C1810', alpha: 0.9, name: 'Espresso' },
    eyebrows: { color: '#4A3728', alpha: 0.55, name: 'Nâu cà phê' },
    foundation: { color: '#DEB887', alpha: 0.32, name: 'Tông nền trung' },
    mascara: { color: '#0D0D0D', alpha: 0.94, name: 'Đen tuyền mềm' },
  },
  tan: {
    lips: { color: '#8B3A3A', alpha: 0.7, name: 'Đỏ gạch' },
    eyeshadow: { color: '#A0522D', alpha: 0.38, name: 'Cam cháy' },
    blush: { color: '#CD853F', alpha: 0.32, name: 'Đồng ánh kim' },
    eyeliner: { color: '#1C1008', alpha: 0.92, name: 'Đen nâu' },
    eyebrows: { color: '#3D2914', alpha: 0.58, name: 'Nâu sậm' },
    foundation: { color: '#D2A679', alpha: 0.34, name: 'Tông nền ngăm' },
    mascara: { color: '#000000', alpha: 0.96, name: 'Đen đậm' },
  },
  dark: {
    lips: { color: '#722F37', alpha: 0.72, name: 'Rượu vang' },
    eyeshadow: { color: '#8B4513', alpha: 0.4, name: 'Nâu đỏ' },
    blush: { color: '#B8593B', alpha: 0.35, name: 'Terracotta' },
    eyeliner: { color: '#0D0D0D', alpha: 0.95, name: 'Đen tuyền' },
    eyebrows: { color: '#2D1F14', alpha: 0.6, name: 'Nâu đen' },
    foundation: { color: '#8B6914', alpha: 0.36, name: 'Tông nền nâu' },
    mascara: { color: '#000000', alpha: 0.97, name: 'Đen sâu' },
  },
  deep: {
    lips: { color: '#5C2A2A', alpha: 0.75, name: 'Mận chín' },
    eyeshadow: { color: '#6B4423', alpha: 0.42, name: 'Đồng đậm' },
    blush: { color: '#8B4513', alpha: 0.38, name: 'Nâu ánh đỏ' },
    eyeliner: { color: '#000000', alpha: 0.95, name: 'Jet black' },
    eyebrows: { color: '#1A1209', alpha: 0.62, name: 'Đen tự nhiên' },
    foundation: { color: '#5C4033', alpha: 0.38, name: 'Tông nền nâu đậm' },
    mascara: { color: '#000000', alpha: 0.98, name: 'Đen tuyền' },
  },
};

// Face analysis result type
type FaceAnalysisResult = {
  skinTone: SkinToneType | null;
  skinToneColor: string | null;
  faceShape: FaceShapeType | null;
  lipShape: LipShapeType | null;
};

// Type for suggested product with variant
type SuggestedProductVariant = {
  group: FeatureGroupKey;
  product: Product;
  variant: ProductVariant;
  colorDifference: number;
};

type FeatureState = {
  enabled: boolean
  color: string
  alpha: number
}

type FeatureStateMap = Record<FeatureName, FeatureState>

const clampAlpha = (value: number) => Math.min(1, Math.max(0, value))

const rgbToHex = (rgb: string) => {
  const [r, g, b] = rgb.split(',').map((value) =>
    Number.parseInt(value.trim(), 10),
  )
  const toHex = (component: number) => component.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '')
  const normalized =
    sanitized.length === 3
      ? sanitized
        .split('')
        .map((char) => `${char}${char}`)
        .join('')
      : sanitized
  const r = Number.parseInt(normalized.slice(0, 2), 16)
  const g = Number.parseInt(normalized.slice(2, 4), 16)
  const b = Number.parseInt(normalized.slice(4, 6), 16)
  return `${r},${g},${b}`
}

const createInitialFeatureSettings = () => {
  const initial: Partial<FeatureStateMap> = {}
  FEATURE_CONFIGS.forEach(({ name, color, alpha }) => {
    initial[name] = {
      enabled: false, // Start with no makeup applied
      color: rgbToHex(color),
      alpha,
    }
  })
  return initial as FeatureStateMap
}

const BLUSH_FEATURES: ReadonlySet<FeatureName> = new Set([
  'BLUSH_LEFT',
  'BLUSH_RIGHT',
])

const EYEBROW_FEATURES: ReadonlySet<FeatureName> = new Set([
  'EYEBROW_LEFT',
  'EYEBROW_RIGHT',
])

const MASCARA_FEATURES: ReadonlySet<FeatureName> = new Set([
  'MASCARA_LEFT',
  'MASCARA_RIGHT',
])

const EYELINER_FEATURES: ReadonlySet<FeatureName> = new Set([
  'EYELINER_LEFT',
  'EYELINER_RIGHT',
])

const isVariantOutOfStock = (variant: ProductVariant) =>
  Number.isFinite(variant.stock) && variant.stock <= 0

const useFaceMesh = (onResults: (results: any) => void, shouldInitialize: boolean = false) => {
  const faceMeshRef = useRef<any | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Don't initialize if not needed
    if (!shouldInitialize) {
      return
    }

    const FaceMesh = getFaceMeshClass()

    if (!FaceMesh) {
      console.warn('FaceMesh not loaded yet from CDN')
      return
    }

    let faceMesh: any = null

    try {
      // MediaPipe global setup is already done by loadMediaPipeScripts()
      // Create FaceMesh instance
      faceMesh = new FaceMesh({
        locateFile: (file: string) => {
          // Force non-SIMD version for better compatibility with Next.js
          const fileName = file.replace('_simd_wasm_bin', '_wasm_bin')
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${fileName}`
        },
      })

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      faceMesh.onResults(onResults)
      faceMeshRef.current = faceMesh

      // Initialize FaceMesh
      const initFaceMesh = async () => {
        try {
          if (typeof faceMesh.initialize === 'function') {
            await faceMesh.initialize()
          }
          faceMesh._ready = true
          setIsInitialized(true)
          console.log('FaceMesh initialized and ready')
        } catch (err) {
          console.error('FaceMesh initialization error:', err)
          faceMesh._ready = true
          setIsInitialized(true)
        }
      }
      void initFaceMesh()
    } catch (err) {
      console.error('Failed to create FaceMesh instance:', err)
    }

    return () => {
      if (faceMesh && typeof faceMesh.close === 'function') {
        try {
          void faceMesh.close()
        } catch (err) {
          console.error('Error closing FaceMesh:', err)
        }
      }
      faceMeshRef.current = null
      setIsInitialized(false)
    }
  }, [onResults, shouldInitialize])

  return faceMeshRef
}

const drawFeature = (
  ctx: CanvasRenderingContext2D,
  landmarks: any,
  indices: number[],
  width: number,
  height: number,
  rgb: string,
  alpha: number,
) => {
  if (!indices.length) {
    return
  }

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = `rgba(${rgb},1)`
  ctx.beginPath()

  indices.forEach((idx, pointIndex) => {
    const landmark = landmarks[idx]
    const x = landmark.x * width
    const y = landmark.y * height
    if (pointIndex === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

const drawLandmarks = (
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  width: number,
  height: number,
) => {
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.strokeStyle = 'rgba(123,97,255,0.45)'
  ctx.lineWidth = 0.75

  landmarks.forEach((landmark) => {
    const x = landmark.x * width
    const y = landmark.y * height
    ctx.beginPath()
    ctx.arc(x, y, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })

  ctx.restore()
}

// Analyze skin tone from image data at cheek positions
const analyzeSkinTone = (
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  width: number,
  height: number,
): { type: SkinToneType; color: string } => {
  const indices = FACE_ANALYSIS_INDICES.cheekSampleIndices;
  const colors: { r: number; g: number; b: number }[] = [];

  indices.forEach((idx) => {
    const landmark = landmarks[idx];
    if (landmark) {
      const x = Math.floor(landmark.x * width);
      const y = Math.floor(landmark.y * height);

      // Validate coordinates are within canvas bounds
      if (x < 2 || y < 2 || x >= width - 2 || y >= height - 2) {
        return;
      }

      try {
        // Sample a small area around the point
        const imageData = ctx.getImageData(x - 2, y - 2, 5, 5);
        const data = imageData.data;

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Skip transparent or very dark/bright pixels
          const alpha = data[i + 3];
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;

          if (alpha > 200 && brightness > 20 && brightness < 250) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }

        if (count > 5) { // Need at least some valid pixels
          colors.push({
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count),
          });
        }
      } catch (e) {
        console.warn('Error sampling pixel at', x, y, e);
      }
    }
  });

  // Need at least some color samples
  if (colors.length === 0) {
    console.warn('No valid color samples found, using default');
    return { type: 'medium', color: '#C8A882' };
  }

  // Calculate average color
  const avgColor = colors.reduce(
    (acc, c) => ({
      r: acc.r + c.r / colors.length,
      g: acc.g + c.g / colors.length,
      b: acc.b + c.b / colors.length,
    }),
    { r: 0, g: 0, b: 0 }
  );

  // Calculate brightness/luminance
  const luminance = (0.299 * avgColor.r + 0.587 * avgColor.g + 0.114 * avgColor.b);

  console.log('Skin tone analysis:', {
    sampleCount: colors.length,
    avgColor,
    luminance
  });

  // Determine skin tone based on luminance
  let skinToneType: SkinToneType;
  if (luminance > 200) {
    skinToneType = 'fair';
  } else if (luminance > 170) {
    skinToneType = 'light';
  } else if (luminance > 140) {
    skinToneType = 'medium';
  } else if (luminance > 110) {
    skinToneType = 'tan';
  } else if (luminance > 80) {
    skinToneType = 'dark';
  } else {
    skinToneType = 'deep';
  }

  const hexColor = `#${Math.round(avgColor.r).toString(16).padStart(2, '0')}${Math.round(avgColor.g).toString(16).padStart(2, '0')}${Math.round(avgColor.b).toString(16).padStart(2, '0')}`;

  return { type: skinToneType, color: hexColor };
};

// Analyze face shape from landmarks
const analyzeFaceShape = (
  landmarks: any[],
  width: number,
  height: number,
): FaceShapeType => {
  const { foreheadLeft, foreheadRight, cheekboneLeft, cheekboneRight, jawLeft, jawRight, foreheadTop, chinBottom } = FACE_ANALYSIS_INDICES;

  // Calculate distances
  const getDistance = (idx1: number, idx2: number) => {
    const p1 = landmarks[idx1];
    const p2 = landmarks[idx2];
    const dx = (p2.x - p1.x) * width;
    const dy = (p2.y - p1.y) * height;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const foreheadWidth = getDistance(foreheadLeft, foreheadRight);
  const cheekboneWidth = getDistance(cheekboneLeft, cheekboneRight);
  const jawWidth = getDistance(jawLeft, jawRight);
  const faceLength = getDistance(foreheadTop, chinBottom);

  // Calculate ratios
  const widthToLength = cheekboneWidth / faceLength;
  const foreheadToJaw = foreheadWidth / jawWidth;
  const cheekToJaw = cheekboneWidth / jawWidth;
  const foreheadToCheek = foreheadWidth / cheekboneWidth;

  // Determine face shape based on ratios
  if (widthToLength > 0.85) {
    // Face is almost as wide as long
    if (cheekToJaw > 1.1) {
      return 'round';
    }
    return 'square';
  }

  if (widthToLength < 0.65) {
    return 'oblong';
  }

  if (foreheadToJaw > 1.2 && cheekToJaw > 1.1) {
    return 'heart';
  }

  if (foreheadToCheek < 0.9 && cheekToJaw > 1.15) {
    return 'diamond';
  }

  // Default to oval for balanced proportions
  return 'oval';
};

// Analyze lip shape from landmarks
const analyzeLipShape = (
  landmarks: any[],
  width: number,
  height: number,
): LipShapeType => {
  const {
    lipUpperCenter, lipLowerCenter, lipLeft, lipRight,
    lipUpperPeakLeft, lipUpperPeakRight, lipUpperTop, lipLowerBottom
  } = FACE_ANALYSIS_INDICES;

  // Calculate distances
  const getDistance = (idx1: number, idx2: number) => {
    const p1 = landmarks[idx1];
    const p2 = landmarks[idx2];
    const dx = (p2.x - p1.x) * width;
    const dy = (p2.y - p1.y) * height;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getYDistance = (idx1: number, idx2: number) => {
    const p1 = landmarks[idx1];
    const p2 = landmarks[idx2];
    return Math.abs(p2.y - p1.y) * height;
  };

  // Lip measurements
  const lipWidth = getDistance(lipLeft, lipRight);
  const upperLipHeight = getYDistance(lipUpperTop, lipUpperCenter);
  const lowerLipHeight = getYDistance(lipLowerCenter, lipLowerBottom);
  const totalLipHeight = upperLipHeight + lowerLipHeight;

  // Cupid's bow measurement (difference in Y between peaks and center)
  const peakLeftY = landmarks[lipUpperPeakLeft].y;
  const peakRightY = landmarks[lipUpperPeakRight].y;
  const centerY = landmarks[lipUpperCenter].y;
  const cupidBowDepth = ((peakLeftY + peakRightY) / 2 - centerY) * height;

  // Corner positions to detect downturned lips
  const leftCornerY = landmarks[lipLeft].y;
  const rightCornerY = landmarks[lipRight].y;
  const avgCornerY = (leftCornerY + rightCornerY) / 2;
  const lipCenterY = (landmarks[lipUpperCenter].y + landmarks[lipLowerCenter].y) / 2;

  // Calculate ratios
  const widthToHeightRatio = lipWidth / totalLipHeight;
  const upperToLowerRatio = upperLipHeight / lowerLipHeight;

  // Determine lip shape
  // Check for downturned lips first
  if (avgCornerY > lipCenterY + 0.005) {
    return 'downturned';
  }

  // Check for heart-shaped lips (prominent cupid's bow)
  if (cupidBowDepth > 2.5) {
    return 'heart';
  }

  // Check width ratio for wide lips
  if (widthToHeightRatio > 4.5) {
    return 'wide';
  }

  // Check for thin lips
  if (totalLipHeight < 12 || widthToHeightRatio > 3.8) {
    return 'thin';
  }

  // Check for full lips
  if (totalLipHeight > 18 && upperToLowerRatio > 0.6 && upperToLowerRatio < 1.4) {
    return 'full';
  }

  // Default to round for balanced proportions
  return 'round';
};

// Screen types
type ScreenType = 'home' | 'makeup' | 'skincare'
type MakeupMode = 'camera' | 'upload' | 'suggestion'

export default function AIStudioMakeup() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { addToCart, isAdding: isAddingToCart } = useCart()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const compareVideoRef = useRef<HTMLVideoElement | null>(null) // For "before" view in compare mode
  const compareCanvasRef = useRef<HTMLCanvasElement | null>(null) // For "after" view in compare mode
  const animationFrameRef = useRef<number | null>(null)
  const isProcessingFrameRef = useRef(false)

  // Screen navigation state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home')
  const [makeupMode, setMakeupMode] = useState<MakeupMode | null>(null)
  const makeupModeRef = useRef<MakeupMode | null>(null)

  const [featureSettings, setFeatureSettings] = useState<FeatureStateMap>(
    () => createInitialFeatureSettings(),
  )
  const featureSettingsRef = useRef(featureSettings)
  const [showLandmarks, _setShowLandmarks] = useState(false)
  void _setShowLandmarks // Keep for future use

  // Face analysis state - used internally but panel display is hidden
  const [_faceAnalysis, setFaceAnalysis] = useState<FaceAnalysisResult>({
    skinTone: null,
    skinToneColor: null,
    faceShape: null,
    lipShape: null,
  })
  void _faceAnalysis // Keep for future use

  // Suggestion modal state
  const [showSuggestionModal, setShowSuggestionModal] = useState(false)
  const [suggestedSkinTone, setSuggestedSkinTone] = useState<SkinToneType | null>(null)
  const [suggestedSkinColor, setSuggestedSkinColor] = useState<string | null>(null)
  const [suggestionImage, setSuggestionImage] = useState<string | null>(null)
  const [suggestionImageElement, setSuggestionImageElement] = useState<HTMLImageElement | null>(null)
  const [suggestedProducts, setSuggestedProducts] = useState<Map<FeatureGroupKey, SuggestedProductVariant>>(new Map())
  const [uploadedImageElement, setUploadedImageElement] = useState<HTMLImageElement | null>(null)
  const suggestionInputRef = useRef<HTMLInputElement | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const suggestionAnalysisRef = useRef<{
    image: HTMLImageElement;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    resolve: (result: { skinTone: SkinToneType; color: string } | null) => void;
  } | null>(null)

  useEffect(() => {
    featureSettingsRef.current = featureSettings
  }, [featureSettings])

  useEffect(() => {
    makeupModeRef.current = makeupMode
  }, [makeupMode])

  const [isCameraActive, setIsCameraActive] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null) // Format: "productId-variantId"
  const [expandedProductGroup, setExpandedProductGroup] = useState<FeatureGroupKey | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null) // For product detail view
  const [appliedMakeup, setAppliedMakeup] = useState<Map<FeatureGroupKey, { product: Product; variant: ProductVariant; brand?: typeof MOCK_BRANDS[0] }>>(new Map())
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [hasCompletedTryOn, setHasCompletedTryOn] = useState(false)
  const [showVrReviewPrompt, setShowVrReviewPrompt] = useState(false)

  // Compare mode states
  const [beforeSnapshot, setBeforeSnapshot] = useState<string | null>(null)
  const [afterSnapshot, setAfterSnapshot] = useState<string | null>(null)
  const [isComparing, setIsComparing] = useState(false)
  const beforeSnapshotCapturedRef = useRef(false)

  // Re-render uploaded image when feature settings change or exiting compare mode
  useEffect(() => {
    if (uploadedImageElement && faceMeshRef.current && makeupMode === 'upload' && !isComparing) {
      faceMeshRef.current.send({ image: uploadedImageElement }).catch(console.error)
    }
  }, [featureSettings, uploadedImageElement, makeupMode, isComparing])

  // Re-render suggestion image when feature settings change or exiting compare mode
  useEffect(() => {
    if (suggestionImageElement && faceMeshRef.current && makeupMode === 'suggestion' && !isComparing) {
      faceMeshRef.current.send({ image: suggestionImageElement }).catch(console.error)
    }
  }, [featureSettings, suggestionImageElement, makeupMode, isComparing])

  // Sync video stream to compareVideoRef when entering compare mode in camera mode
  useEffect(() => {
    if (isComparing && makeupMode === 'camera' && videoRef.current?.srcObject && compareVideoRef.current) {
      compareVideoRef.current.srcObject = videoRef.current.srcObject
      compareVideoRef.current.play().catch(console.error)
    }
  }, [isComparing, makeupMode])

  // Copy canvas content to compareCanvasRef continuously when in camera compare mode
  useEffect(() => {
    if (!isComparing || makeupMode !== 'camera' || !canvasRef.current || !compareCanvasRef.current) {
      return
    }

    const sourceCanvas = canvasRef.current
    const destCanvas = compareCanvasRef.current
    const destCtx = destCanvas.getContext('2d')
    if (!destCtx) return

    let frameId: number

    const copyFrame = () => {
      if (sourceCanvas.width > 0 && sourceCanvas.height > 0) {
        destCanvas.width = sourceCanvas.width
        destCanvas.height = sourceCanvas.height
        destCtx.drawImage(sourceCanvas, 0, 0)
      }
      frameId = requestAnimationFrame(copyFrame)
    }

    copyFrame()

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [isComparing, makeupMode])

  // Products from API
  const [apiProducts, setApiProducts] = useState<Map<FeatureGroupKey, Product[]>>(new Map())
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isMediaPipeLoaded, setIsMediaPipeLoaded] = useState(false)

  // Load MediaPipe scripts when entering makeup screen
  useEffect(() => {
    if (currentScreen === 'makeup' && !isMediaPipeLoaded) {
      import('@/lib/mediapipe-setup').then(({ loadMediaPipeScripts }) => {
        loadMediaPipeScripts()
          .then(() => {
            setIsMediaPipeLoaded(true)
            console.log('MediaPipe loaded and ready')
          })
          .catch((error) => {
            console.error('Failed to load MediaPipe:', error)
          })
      })
    }
  }, [currentScreen, isMediaPipeLoaded])

  // Load products from API when entering makeup screen
  useEffect(() => {
    if (currentScreen === 'makeup' && apiProducts.size === 0) {
      setIsLoadingProducts(true)
      fetchProductsByCategories(50)
        .then((productsMap) => {
          setApiProducts(productsMap)
          console.log('Loaded products from API:', productsMap)
        })
        .catch((error) => {
          console.error('Failed to load products:', error)
          // Empty fallback - no local products
          setApiProducts(new Map())
        })
        .finally(() => {
          setIsLoadingProducts(false)
        })
    }
  }, [currentScreen, apiProducts.size])

  // Log apiProducts summary when it changes (for debugging)
  useEffect(() => {
    if (apiProducts.size > 0) {
      const summary: Record<string, number> = {}
      apiProducts.forEach((products, key) => {
        summary[key] = products.length
      })
      console.log('[DEBUG] apiProducts loaded:', summary)
    }
  }, [apiProducts])


  const stopCameraStream = useCallback(() => {
    const video = videoRef.current
    const stream = (video?.srcObject as MediaStream | null) ?? null
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }
    if (video) {
      video.srcObject = null
      void video.pause()
    }
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    isProcessingFrameRef.current = false
    setIsCameraActive(false)
    setStatusMessage('')
  }, [])

  // Auto stop camera when leaving makeup screen
  useEffect(() => {
    if (currentScreen !== 'makeup') {
      stopCameraStream()
    }
  }, [currentScreen, stopCameraStream])

  const handleResults = useCallback(
    (results: any) => {
      const canvas = canvasRef.current
      if (!canvas) {
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return
      }

      const width = results.image.width
      const height = results.image.height

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(results.image, 0, 0, width, height)

      const landmarks = results.multiFaceLandmarks?.[0]
      if (!landmarks) {
        console.log('No face landmarks detected. Mode:', makeupModeRef.current)
        // Only show "face not found" for camera mode, not for static images
        // In suggestion/upload mode, face was already detected during initial analysis
        if (makeupModeRef.current === 'camera') {
          setStatusMessage('Không tìm thấy khuôn mặt.')
        }
        // Resolve suggestion analysis with null if no face found
        if (suggestionAnalysisRef.current) {
          console.warn('Resolving suggestion analysis with null - no landmarks')
          suggestionAnalysisRef.current.resolve(null)
          suggestionAnalysisRef.current = null
        }
        return
      }

      console.log('Face landmarks detected, count:', landmarks.length)

      setStatusMessage('')

      const currentSettings = featureSettingsRef.current

      FEATURE_CONFIGS.forEach(({ name, indices }) => {
        const settings = currentSettings[name]
        if (!settings?.enabled) {
          return
        }

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

        drawFeature(
          ctx,
          landmarks,
          indices,
          width,
          height,
          rgb,
          settings.alpha,
        )
      })

      if (showLandmarks) {
        drawLandmarks(ctx, landmarks, width, height)
      }

      // Analyze face features (skin tone and face shape)
      try {
        const skinToneResult = analyzeSkinTone(ctx, landmarks, width, height)
        const faceShapeResult = analyzeFaceShape(landmarks, width, height)
        const lipShapeResult = analyzeLipShape(landmarks, width, height)

        // Note: Face analysis runs every frame, so we don't log here to avoid console flooding

        setFaceAnalysis({
          skinTone: skinToneResult.type,
          skinToneColor: skinToneResult.color,
          faceShape: faceShapeResult,
          lipShape: lipShapeResult,
        })

        // Check if we're doing suggestion analysis
        if (suggestionAnalysisRef.current) {
          console.log('Resolving suggestion analysis with:', skinToneResult)
          const { resolve } = suggestionAnalysisRef.current
          resolve({ skinTone: skinToneResult.type, color: skinToneResult.color })
          suggestionAnalysisRef.current = null
        }
      } catch (e) {
        console.error('Face analysis error:', e)
        // Resolve suggestion analysis with null on error
        if (suggestionAnalysisRef.current) {
          console.warn('Resolving suggestion analysis with null due to error')
          suggestionAnalysisRef.current.resolve(null)
          suggestionAnalysisRef.current = null
        }
      }
    },
    [setStatusMessage, showLandmarks],
  )

  const faceMeshRef = useFaceMesh(handleResults, currentScreen === 'makeup' && isMediaPipeLoaded)

  // Ensure FaceMesh is initialized before sending images
  // Note: FaceMesh is initialized in useFaceMesh, this just waits for it
  const ensureFaceMeshReady = useCallback(async () => {
    // Wait for initialization to complete (max 5 seconds)
    let attempts = 0
    while (attempts < 50) {
      const faceMesh = faceMeshRef.current
      if (faceMesh) {
        if (faceMesh._ready) return true
      }
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }

    console.error('FaceMesh initialization timeout')
    return false
  }, [faceMeshRef])

  useEffect(() => () => {
    stopCameraStream()
  }, [stopCameraStream])

  const processVideoFrame = useCallback(async () => {
    const faceMesh = faceMeshRef.current
    const video = videoRef.current

    if (!faceMesh || !video || !video.srcObject) {
      animationFrameRef.current = null
      return
    }

    if (video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrame)
      return
    }

    if (isProcessingFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(processVideoFrame)
      return
    }

    isProcessingFrameRef.current = true

    try {
      await faceMesh.send({ image: video })
    } catch (error) {
      console.error(error)
      setErrorMessage('Không thể xử lý khung hình từ camera.')
    }

    isProcessingFrameRef.current = false

    if (!video.srcObject) {
      animationFrameRef.current = null
      return
    }

    animationFrameRef.current = requestAnimationFrame(processVideoFrame)
  }, [faceMeshRef, setErrorMessage])

  const startCamera = useCallback(async () => {
    if (!faceMeshRef.current) {
      setErrorMessage('FaceMesh chưa sẵn sàng.')
      return
    }

    const ready = await ensureFaceMeshReady()
    if (!ready) {
      setErrorMessage('Không thể khởi tạo FaceMesh. Vui lòng thử lại.')
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Trình duyệt không hỗ trợ camera.')
      return
    }

    stopCameraStream()
    setErrorMessage('')
    setStatusMessage('Đang mở camera...')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 960 } },
        audio: false,
      })
      const video = videoRef.current
      if (!video) {
        throw new Error('Video element is missing')
      }
      video.srcObject = stream
      await video.play()
      setIsCameraActive(true)
      setStatusMessage('Đang áp dụng makeup trực tiếp...')
      animationFrameRef.current = requestAnimationFrame(processVideoFrame)
    } catch (error) {
      console.error(error)
      setErrorMessage('Không thể truy cập camera. Kiểm tra quyền truy cập.')
      setStatusMessage('')
      stopCameraStream()
    }
  }, [ensureFaceMeshReady, faceMeshRef, processVideoFrame, stopCameraStream])

  const handleFileSelected = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''

      if (!file) {
        return
      }

      if (!faceMeshRef.current) {
        setErrorMessage('FaceMesh chưa sẵn sàng.')
        return
      }

      stopCameraStream()
      setErrorMessage('')
      setStatusMessage('Đang xử lý ảnh...')

      const loadImage = () =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image()
          const objectUrl = URL.createObjectURL(file)
          image.onload = () => {
            URL.revokeObjectURL(objectUrl)
            resolve(image)
          }
          image.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error('Không thể đọc ảnh.'))
          }
          image.src = objectUrl
        })

      try {
        const image = await loadImage()
        // Save the uploaded image for re-rendering when settings change
        setUploadedImageElement(image)
        // Reset compare states when new image is selected
        setBeforeSnapshot(null)
        setAfterSnapshot(null)
        setIsComparing(false)
        beforeSnapshotCapturedRef.current = false
        const ready = await ensureFaceMeshReady()
        if (!ready) {
          throw new Error('FaceMesh chưa sẵn sàng')
        }
        await faceMeshRef.current.send({ image })
        setStatusMessage('')
      } catch (error) {
        console.error(error)
        setErrorMessage('Không thể xử lý ảnh đã chọn.')
        setStatusMessage('')
        setUploadedImageElement(null)
      }
    },
    [faceMeshRef, stopCameraStream, ensureFaceMeshReady],
  )

  // Keeping these handlers for future use when feature panel is re-enabled
  const _handleToggleGroup = useCallback((groupKey: FeatureGroupKey) => {
    setFeatureSettings((previous) => {
      const group = FEATURE_GROUPS.find((item) => item.key === groupKey)
      if (!group) {
        return previous
      }

      const shouldEnable = !group.featureNames.every(
        (name) => previous[name]?.enabled,
      )

      const next: FeatureStateMap = { ...previous }

      group.featureNames.forEach((name) => {
        const current = previous[name]
        next[name] = {
          ...current,
          enabled: shouldEnable,
        }
      })

      return next
    })
  }, [])
  void _handleToggleGroup

  const _handleGroupColorChange = useCallback(
    (groupKey: FeatureGroupKey, newColor: string) => {
      setFeatureSettings((previous) => {
        const group = FEATURE_GROUPS.find((item) => item.key === groupKey)
        if (!group) {
          return previous
        }

        const next: FeatureStateMap = { ...previous }

        group.featureNames.forEach((name) => {
          const current = previous[name]
          next[name] = {
            ...current,
            color: newColor,
          }
        })

        return next
      })
    },
    [],
  )
  void _handleGroupColorChange

  const _handleGroupAlphaChange = useCallback(
    (groupKey: FeatureGroupKey, newAlpha: number) => {
      const clampedAlpha = clampAlpha(newAlpha)

      setFeatureSettings((previous) => {
        const group = FEATURE_GROUPS.find((item) => item.key === groupKey)
        if (!group) {
          return previous
        }

        const next: FeatureStateMap = { ...previous }

        group.featureNames.forEach((name) => {
          const current = previous[name]
          next[name] = {
            ...current,
            alpha: clampedAlpha,
          }
        })

        return next
      })
    },
    [],
  )
  void _handleGroupAlphaChange

  const handleSelectVariant = useCallback(
    (product: Product, variant: ProductVariant) => {
      console.log('[UI] handleSelectVariant called:', { productId: product.id, variantId: variant.id, group: product.group })
      setFeatureSettings((previous) => {
        const group = FEATURE_GROUPS.find((item) => item.key === product.group)
        if (!group) return previous

        const next: typeof previous = { ...previous }

        group.featureNames.forEach((name) => {
          const current = previous[name]
          next[name] = {
            ...current,
            enabled: true,
            color: variant.shade_hex || '#000000',
            alpha: variant.opacity != null ? variant.opacity : current.alpha,
          }
        })

        return next
      })

      setSelectedVariantId(`${product.id}-${variant.id}`)

      // Record VR try-on for analytics
      apiClient(ENDPOINTS.MAKEUP.RECORD_TRYON, {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, variant_id: variant.id }),
      })
        .then(() => setHasCompletedTryOn(true))
        .catch(() => setHasCompletedTryOn(true))

      // Track applied makeup
      const brand = MOCK_BRANDS.find((b) => b.id === product.brand_id)
      console.log('[UI] applying makeup to group:', product.group, 'brandId:', brand?.id)
      setAppliedMakeup((prev) => {
        const next = new Map(prev)
        next.set(product.group, { product, variant, brand })
        return next
      })
    },
    [],
  )

  const handleRemoveMakeup = useCallback(
    (groupKey: FeatureGroupKey) => {
      console.log('[UI] handleRemoveMakeup called for group:', groupKey)
      setFeatureSettings((previous) => {
        const group = FEATURE_GROUPS.find((item) => item.key === groupKey)
        if (!group) return previous

        const next: FeatureStateMap = { ...previous }

        group.featureNames.forEach((name) => {
          const current = previous[name]
          next[name] = {
            ...current,
            enabled: false,
          }
        })

        return next
      })

      setAppliedMakeup((prev) => {
        const next = new Map(prev)
        next.delete(groupKey)
        return next
      })

      setSelectedVariantId(null)
    },
    [],
  )

  const handleAddTriedProductToCart = useCallback(
    (product: Product, variant: ProductVariant) => {
      if (!user) {
        router.push('/login')
        return
      }

      addToCart({
        productId: product.id,
        quantity: 1,
        variantId: variant.id,
      })
    },
    [addToCart, router, user],
  )

  const handleBuyTriedProduct = useCallback(
    (product: Product, variant: ProductVariant) => {
      if (!user) {
        router.push('/login')
        return
      }

      const params = new URLSearchParams({
        buyNow: 'true',
        productId: String(product.id),
        quantity: '1',
        variantId: String(variant.id),
      })

      router.push(`/checkout?${params.toString()}`)
    },
    [router, user],
  )

  // Toggle product category panel with logging for debugging
  const handleToggleGroup = useCallback((groupKey: FeatureGroupKey, wasExpanded: boolean, availableCount: number) => {
    console.log('[UI] handleToggleGroup:', { groupKey, wasExpanded, availableCount, apiProductsSize: apiProducts.size })
    setExpandedProductGroup(wasExpanded ? null : groupKey)
  }, [apiProducts])

  // Handle suggestion image upload
  const handleSuggestionImageUpload = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''

      if (!file) return

      if (!faceMeshRef.current) {
        setErrorMessage('FaceMesh chưa sẵn sàng.')
        return
      }

      stopCameraStream()
      setShowSuggestionModal(true)
      setSuggestedSkinTone(null)
      setSuggestedSkinColor(null)
      setStatusMessage('')
      setErrorMessage('')

      const objectUrl = URL.createObjectURL(file)
      setSuggestionImage(objectUrl)

      const loadImage = () =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image()
          image.onload = () => resolve(image)
          image.onerror = () => reject(new Error('Không thể đọc ảnh.'))
          image.src = objectUrl
        })

      try {
        const image = await loadImage()

        // Save the image element for later use when applying makeup
        setSuggestionImageElement(image)

        // Reset compare states when new image is selected
        setBeforeSnapshot(null)
        setAfterSnapshot(null)
        setIsComparing(false)
        beforeSnapshotCapturedRef.current = false

        // Create a promise that will be resolved when handleResults processes the image
        const analysisPromise = new Promise<{ skinTone: SkinToneType; color: string } | null>((resolve) => {
          suggestionAnalysisRef.current = {
            image,
            canvas: document.createElement('canvas'), // Not used, just for type compatibility
            ctx: null as any, // Will use canvas from handleResults
            resolve,
          }

          // Add timeout to prevent infinite waiting
          setTimeout(() => {
            if (suggestionAnalysisRef.current) {
              console.warn('Analysis timeout - no face detected')
              suggestionAnalysisRef.current.resolve(null)
              suggestionAnalysisRef.current = null
            }
          }, 10000) // 10 second timeout
        })

        // Send image to FaceMesh (ensure ready)
        const ready = await ensureFaceMeshReady()
        if (!ready) {
          throw new Error('FaceMesh chưa sẵn sàng')
        }
        await faceMeshRef.current.send({ image })

        // Wait for analysis result with logging
        console.log('Waiting for face analysis...')
        const result = await analysisPromise
        console.log('Analysis result:', result)

        if (result) {
          console.log('Successfully analyzed skin tone:', result.skinTone)
          setSuggestedSkinTone(result.skinTone)
          setSuggestedSkinColor(result.color)
        } else {
          console.warn('No face found in image')
          setErrorMessage('Không tìm thấy khuôn mặt trong ảnh. Vui lòng chọn ảnh có khuôn mặt rõ ràng, nhìn thẳng và đủ sáng.')
          setShowSuggestionModal(false)
          setSuggestionImageElement(null)
          URL.revokeObjectURL(objectUrl)
        }
      } catch (error) {
        console.error('Error during suggestion analysis:', error)
        setErrorMessage('Không thể phân tích ảnh. Vui lòng thử lại với ảnh khác.')
        setShowSuggestionModal(false)
        setSuggestionImageElement(null)
        URL.revokeObjectURL(objectUrl)
      }
    },
    [faceMeshRef, stopCameraStream, ensureFaceMeshReady],
  )

  // Apply suggested makeup
  // Hàm tính khoảng cách màu sắc (color difference) sử dụng công thức Euclidean trong không gian RGB
  const calculateColorDifference = useCallback((color1: string, color2: string): number => {
    const hexToRgbValues = (hex: string): [number, number, number] => {
      const sanitized = hex.replace('#', '')
      const normalized = sanitized.length === 3
        ? sanitized.split('').map((char) => `${char}${char}`).join('')
        : sanitized
      const r = parseInt(normalized.slice(0, 2), 16)
      const g = parseInt(normalized.slice(2, 4), 16)
      const b = parseInt(normalized.slice(4, 6), 16)
      return [r, g, b]
    }

    const [r1, g1, b1] = hexToRgbValues(color1)
    const [r2, g2, b2] = hexToRgbValues(color2)

    // Euclidean distance in RGB space
    return Math.sqrt(Math.pow(r2 - r1, 2) + Math.pow(g2 - g1, 2) + Math.pow(b2 - b1, 2))
  }, [])

  // Hàm tìm sản phẩm có màu giống nhất với màu gợi ý
  const findClosestProduct = useCallback((targetColor: string, groupKey: FeatureGroupKey): SuggestedProductVariant | null => {
    // Sử dụng products từ API
    const groupProducts = (apiProducts.get(groupKey) || []).filter((p) => p.is_published)

    let closestMatch: SuggestedProductVariant | null = null
    let minDifference = Infinity

    for (const product of groupProducts) {
      const activeVariants = product.variants.filter((v) => v.is_active && v.shade_hex)

      for (const variant of activeVariants) {
        if (!variant.shade_hex) continue

        const difference = calculateColorDifference(targetColor, variant.shade_hex)

        if (difference < minDifference) {
          minDifference = difference
          closestMatch = {
            group: groupKey,
            product,
            variant,
            colorDifference: difference,
          }
        }
      }
    }

    return closestMatch
  }, [calculateColorDifference, apiProducts])

  const applySuggestedMakeup = useCallback(async () => {
    if (!suggestedSkinTone) return

    const suggestion = MAKEUP_SUGGESTIONS[suggestedSkinTone]

    console.log('Applying makeup for skin tone:', suggestedSkinTone)
    console.log('Fetching recommended products from API...')

    try {
      // Gọi API để lấy sản phẩm gợi ý theo skintone
      const recommendedProducts = await fetchRecommendedProducts(suggestedSkinTone)
      console.log('Recommended products from API:', recommendedProducts)

      const newSuggestedProducts = new Map<FeatureGroupKey, SuggestedProductVariant>()
      const newSettings: FeatureStateMap = { ...featureSettings }
      const newAppliedMakeup = new Map<FeatureGroupKey, { product: Product; variant: ProductVariant; brand?: typeof MOCK_BRANDS[0] }>()

      // Xử lý từng sản phẩm được gợi ý từ API
      for (const recommended of recommendedProducts) {
        // Parse bestMatch để lấy product type (lips, eyeshadow, blush, etc.)
        const matchParts = recommended.bestMatch.split(':')
        const productType = matchParts[0]?.trim().toLowerCase()

        let groupKey: FeatureGroupKey | null = null
        switch (productType) {
          case 'lips':
            groupKey = 'LIPS'
            break
          case 'eyeshadow':
            groupKey = 'EYESHADOW'
            break
          case 'blush':
            groupKey = 'BLUSH'
            break
          case 'eyeliner':
            groupKey = 'EYELINER'
            break
          case 'eyebrows':
            groupKey = 'EYEBROWS'
            break
          case 'foundation':
            groupKey = 'FOUNDATION'
            break
          case 'mascara':
            groupKey = 'MASCARA'
            break
        }

        if (!groupKey || !recommended.variant_id) continue

        // Lấy chi tiết product từ API
        const { product, variant } = await fetchProductDetails(recommended.product_id, recommended.variant_id)

        if (product && variant) {
          // Lưu vào suggested products
          newSuggestedProducts.set(groupKey, {
            group: groupKey,
            product,
            variant,
            colorDifference: recommended.colorDistance,
          })

          // Áp dụng màu vào feature settings
          const group = FEATURE_GROUPS.find((g) => g.key === groupKey)
          const suggestionColor = suggestion[productType as keyof typeof suggestion]

          group?.featureNames.forEach((name) => {
            newSettings[name] = {
              ...featureSettings[name],
              enabled: true,
              color: variant.shade_hex || (suggestionColor as any).color,
              alpha: product.alpha ?? (suggestionColor as any).alpha,
            }
          })

          // Lưu vào applied makeup
          const brand = MOCK_BRANDS.find((b) => b.id === product.brand_id)
          newAppliedMakeup.set(groupKey, { product, variant, brand })
        }
      }

      setSuggestedProducts(newSuggestedProducts)
      console.log('Applied suggested products:', Array.from(newSuggestedProducts.entries()))

      // Update the settings state
      setFeatureSettings(newSettings)

      // Also update the ref immediately so handleResults uses the new settings
      featureSettingsRef.current = newSettings

      // Update applied makeup state
      setAppliedMakeup(newAppliedMakeup)

    } catch (error) {
      console.error('Failed to fetch recommended products:', error)

      // Fallback: Tìm sản phẩm local nếu API thất bại
      const newSuggestedProducts = new Map<FeatureGroupKey, SuggestedProductVariant>()

      const foundLipsProduct = findClosestProduct(suggestion.lips.color, 'LIPS')
      if (foundLipsProduct) newSuggestedProducts.set('LIPS', foundLipsProduct)

      const foundEyeshadowProduct = findClosestProduct(suggestion.eyeshadow.color, 'EYESHADOW')
      if (foundEyeshadowProduct) newSuggestedProducts.set('EYESHADOW', foundEyeshadowProduct)

      const foundBlushProduct = findClosestProduct(suggestion.blush.color, 'BLUSH')
      if (foundBlushProduct) newSuggestedProducts.set('BLUSH', foundBlushProduct)

      const foundEyelinerProduct = findClosestProduct(suggestion.eyeliner.color, 'EYELINER')
      if (foundEyelinerProduct) newSuggestedProducts.set('EYELINER', foundEyelinerProduct)

      const foundEyebrowsProduct = findClosestProduct(suggestion.eyebrows.color, 'EYEBROWS')
      if (foundEyebrowsProduct) newSuggestedProducts.set('EYEBROWS', foundEyebrowsProduct)

      const foundFoundationProduct = findClosestProduct(suggestion.foundation.color, 'FOUNDATION')
      if (foundFoundationProduct) newSuggestedProducts.set('FOUNDATION', foundFoundationProduct)

      const foundMascaraProduct = findClosestProduct(suggestion.mascara.color, 'MASCARA')
      if (foundMascaraProduct) newSuggestedProducts.set('MASCARA', foundMascaraProduct)

      setSuggestedProducts(newSuggestedProducts)

      console.log('Found suggested products (fallback):', Array.from(newSuggestedProducts.entries()))

      // Create new settings using product colors (fallback)
      const newSettings: FeatureStateMap = { ...featureSettings }
      const newAppliedMakeup = new Map<FeatureGroupKey, { product: Product; variant: ProductVariant; brand?: typeof MOCK_BRANDS[0] }>()

      // Apply lips with product
      const lipsProduct = newSuggestedProducts.get('LIPS')
      if (lipsProduct) {
        const lipsGroup = FEATURE_GROUPS.find((g) => g.key === 'LIPS')
        lipsGroup?.featureNames.forEach((name) => {
          newSettings[name] = {
            ...featureSettings[name],
            enabled: true,
            color: lipsProduct.variant.shade_hex || suggestion.lips.color,
            alpha: lipsProduct.product.alpha ?? suggestion.lips.alpha,
          }
        })
        const brand = MOCK_BRANDS.find((b) => b.id === lipsProduct.product.brand_id)
        newAppliedMakeup.set('LIPS', { product: lipsProduct.product, variant: lipsProduct.variant, brand })
      }

      // Apply eyeshadow with product
      const eyeshadowProduct = newSuggestedProducts.get('EYESHADOW')
      if (eyeshadowProduct) {
        const eyeshadowGroup = FEATURE_GROUPS.find((g) => g.key === 'EYESHADOW')
        eyeshadowGroup?.featureNames.forEach((name) => {
          newSettings[name] = {
            ...featureSettings[name],
            enabled: true,
            color: eyeshadowProduct.variant.shade_hex || suggestion.eyeshadow.color,
            alpha: eyeshadowProduct.product.alpha ?? suggestion.eyeshadow.alpha,
          }
        })
        const brand = MOCK_BRANDS.find((b) => b.id === eyeshadowProduct.product.brand_id)
        newAppliedMakeup.set('EYESHADOW', { product: eyeshadowProduct.product, variant: eyeshadowProduct.variant, brand })
      }

      // Apply blush with product
      const blushProduct = newSuggestedProducts.get('BLUSH')
      if (blushProduct) {
        const blushGroup = FEATURE_GROUPS.find((g) => g.key === 'BLUSH')
        blushGroup?.featureNames.forEach((name) => {
          newSettings[name] = {
            ...featureSettings[name],
            enabled: true,
            color: blushProduct.variant.shade_hex || suggestion.blush.color,
            alpha: blushProduct.product.alpha ?? suggestion.blush.alpha,
          }
        })
        const brand = MOCK_BRANDS.find((b) => b.id === blushProduct.product.brand_id)
        newAppliedMakeup.set('BLUSH', { product: blushProduct.product, variant: blushProduct.variant, brand })
      }

      // Apply eyeliner with product
      const eyelinerProduct = newSuggestedProducts.get('EYELINER')
      if (eyelinerProduct) {
        const eyelinerGroup = FEATURE_GROUPS.find((g) => g.key === 'EYELINER')
        eyelinerGroup?.featureNames.forEach((name) => {
          newSettings[name] = {
            ...featureSettings[name],
            enabled: true,
            color: eyelinerProduct.variant.shade_hex || suggestion.eyeliner.color,
            alpha: eyelinerProduct.product.alpha ?? suggestion.eyeliner.alpha,
          }
        })
        const brand = MOCK_BRANDS.find((b) => b.id === eyelinerProduct.product.brand_id)
        newAppliedMakeup.set('EYELINER', { product: eyelinerProduct.product, variant: eyelinerProduct.variant, brand })
      }

      // Apply eyebrows with product
      const eyebrowsProduct = newSuggestedProducts.get('EYEBROWS')
      if (eyebrowsProduct) {
        const eyebrowsGroup = FEATURE_GROUPS.find((g) => g.key === 'EYEBROWS')
        eyebrowsGroup?.featureNames.forEach((name) => {
          newSettings[name] = {
            ...featureSettings[name],
            enabled: true,
            color: eyebrowsProduct.variant.shade_hex || suggestion.eyebrows.color,
            alpha: eyebrowsProduct.product.alpha ?? suggestion.eyebrows.alpha,
          }
        })
        const brand = MOCK_BRANDS.find((b) => b.id === eyebrowsProduct.product.brand_id)
        newAppliedMakeup.set('EYEBROWS', { product: eyebrowsProduct.product, variant: eyebrowsProduct.variant, brand })
      }

      // Apply foundation with product
      const foundationProduct = newSuggestedProducts.get('FOUNDATION')
      if (foundationProduct) {
        const foundationGroup = FEATURE_GROUPS.find((g) => g.key === 'FOUNDATION')
        foundationGroup?.featureNames.forEach((name) => {
          newSettings[name] = {
            ...featureSettings[name],
            enabled: true,
            color: foundationProduct.variant.shade_hex || suggestion.foundation.color,
            alpha: foundationProduct.product.alpha ?? suggestion.foundation.alpha,
          }
        })
        const brand = MOCK_BRANDS.find((b) => b.id === foundationProduct.product.brand_id)
        newAppliedMakeup.set('FOUNDATION', { product: foundationProduct.product, variant: foundationProduct.variant, brand })
      }

      // Apply mascara with product
      const mascaraProduct = newSuggestedProducts.get('MASCARA')
      if (mascaraProduct) {
        const mascaraGroup = FEATURE_GROUPS.find((g) => g.key === 'MASCARA')
        mascaraGroup?.featureNames.forEach((name) => {
          newSettings[name] = {
            ...featureSettings[name],
            enabled: true,
            color: mascaraProduct.variant.shade_hex || suggestion.mascara.color,
            alpha: mascaraProduct.product.alpha ?? suggestion.mascara.alpha,
          }
        })
        const brand = MOCK_BRANDS.find((b) => b.id === mascaraProduct.product.brand_id)
        newAppliedMakeup.set('MASCARA', { product: mascaraProduct.product, variant: mascaraProduct.variant, brand })
      }

      console.log('New feature settings:', newSettings)
      console.log('New applied makeup:', Array.from(newAppliedMakeup.entries()))

      // Update the settings state
      setFeatureSettings(newSettings)

      // Also update the ref immediately so handleResults uses the new settings
      featureSettingsRef.current = newSettings

      // Update applied makeup state
      setAppliedMakeup(newAppliedMakeup)
    }

    setShowSuggestionModal(false)
    setSelectedVariantId(null)

    // Clear any previous messages
    setStatusMessage('')
    setErrorMessage('')

    // Re-send the suggestion image to FaceMesh to render with new settings
    if (suggestionImageElement && faceMeshRef.current) {
      try {
        await faceMeshRef.current.send({ image: suggestionImageElement })
      } catch (error) {
        console.error('Error re-rendering image:', error)
      }
    }
  }, [suggestedSkinTone, featureSettings, suggestionImageElement, faceMeshRef, findClosestProduct])

  // Close suggestion modal
  const closeSuggestionModal = useCallback(() => {
    setShowSuggestionModal(false)
    setSuggestionImage(null)
    setSuggestedSkinTone(null)
    setSuggestedSkinColor(null)
    setSuggestionImageElement(null)
    setSuggestedProducts(new Map())
  }, [])

  // Handle makeup mode selection
  const handleMakeupModeSelect = useCallback((mode: MakeupMode) => {
    // Reset all makeup state to default
    setFeatureSettings(createInitialFeatureSettings())
    featureSettingsRef.current = createInitialFeatureSettings()
    setAppliedMakeup(new Map())
    setSelectedVariantId(null)
    setSelectedProductId(null)
    setExpandedProductGroup(null)

    setMakeupMode(mode)
    setCurrentScreen('makeup')

    // Trigger file input for upload and suggestion modes
    if (mode === 'upload') {
      setTimeout(() => {
        uploadInputRef.current?.click()
      }, 100)
    } else if (mode === 'suggestion') {
      setTimeout(() => {
        suggestionInputRef.current?.click()
      }, 100)
    }
  }, [])

  // Handle back to home
  const handleBackToHome = useCallback(async () => {
    let shouldShowReviewPrompt = false
    if (currentScreen === 'makeup' && hasCompletedTryOn) {
      try {
        const status = await getVrReviewPromptStatus()
        shouldShowReviewPrompt = Boolean(status?.should_show)
      } catch {
        shouldShowReviewPrompt = false
      }
    }

    stopCameraStream()

    // Reset all makeup state to default
    setFeatureSettings(createInitialFeatureSettings())
    featureSettingsRef.current = createInitialFeatureSettings()
    setAppliedMakeup(new Map())
    setSelectedVariantId(null)
    setSelectedProductId(null)
    setExpandedProductGroup(null)

    // Reset compare states
    setBeforeSnapshot(null)
    setAfterSnapshot(null)
    setIsComparing(false)
    beforeSnapshotCapturedRef.current = false

    setCurrentScreen('home')
    setMakeupMode(null)
    setUploadedImageElement(null)
    setSuggestionImageElement(null)
    setErrorMessage('')
    setStatusMessage('')
    setHasCompletedTryOn(false)

    if (shouldShowReviewPrompt) {
      setShowVrReviewPrompt(true)
    }
  }, [currentScreen, hasCompletedTryOn, stopCameraStream])

  const renderVrReviewPrompt = () => (
    <VrReviewDialog
      open={showVrReviewPrompt}
      source="ai_studio_prompt"
      showSnoozeOptions
      onOpenChange={setShowVrReviewPrompt}
    />
  )

  const appliedMakeupEntries = Array.from(appliedMakeup.entries())

  // Render Home Screen
  if (currentScreen === 'home') {
    return (
      <div className="min-h-screen bg-background">
        <header className="container mx-auto px-6 pt-12 pb-8 text-center">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            Beauty AR Application
          </h1>
          <p className="text-muted-foreground text-lg">
            Khám phá vẻ đẹp của bạn với công nghệ thực tế ảo tăng cường
          </p>
        </header>

        <div className="container mx-auto px-6 pb-12 grid md:grid-cols-2 gap-6 max-w-5xl">
          {/* Virtual Makeup Section */}
          <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-all">
            <CardHeader className="text-center pb-4">
              <div className="text-6xl mb-4">Virtual Makeup</div>
              <CardTitle className="text-2xl">Virtual Makeup</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Thử nghiệm các phong cách makeup khác nhau trực tiếp trên khuôn mặt của bạn
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button
                variant="default"
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={() => {
                  handleMakeupModeSelect('camera')
                  setTimeout(() => startCamera(), 100)
                }}
              >
                📷 Camera trực tiếp
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2"
                onClick={() => handleMakeupModeSelect('upload')}
              >
                🖼️ Tải ảnh lên
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-orange-500/10 to-pink-500/10 hover:from-orange-500/20 hover:to-pink-500/20 border-orange-500/30"
                onClick={() => handleMakeupModeSelect('suggestion')}
              >
                ✨ Gợi ý makeup
              </Button>
            </CardContent>
          </Card>

          {/* Skin Care Section */}
          <Card className="overflow-hidden border-border/50 hover:border-primary/50 transition-all">
            <CardHeader className="text-center pb-4">
              <div className="text-6xl mb-4">🧴</div>
              <CardTitle className="text-2xl">Skin Care</CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Phân tích làn da và nhận gợi ý chăm sóc da phù hợp với bạn
              </p>
            </CardHeader>
            <CardContent>
              <Button
                variant="default"
                size="lg"
                className="w-full gap-2 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                onClick={() => router.push('/ai-studio/chat')}
              >
                🌟 Bắt đầu
              </Button>
            </CardContent>
          </Card>
        </div>
        {renderVrReviewPrompt()}
      </div>
    )
  }

  // Render Skincare Screen
  if (currentScreen === 'skincare') {
    return (
      <div className="min-h-screen bg-background">
        <header className="container mx-auto px-6 py-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackToHome}>
            <span className="text-lg">←</span>
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold">🧴 Skin Care</h1>
            <p className="text-muted-foreground">Phân tích và chăm sóc làn da của bạn</p>
          </div>
          <div className="w-10" />
        </header>

        <div className="container mx-auto px-6 py-12">
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="py-12">
              <div className="text-7xl mb-6">🚧</div>
              <h2 className="text-2xl font-bold mb-3">Tính năng đang phát triển</h2>
              <p className="text-muted-foreground mb-6">
                Chức năng Skin Care sẽ sớm được ra mắt. Vui lòng quay lại sau!
              </p>
              <Button onClick={handleBackToHome} variant="outline">
                ← Quay về trang chủ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Get subtitle based on makeup mode
  const getMakeupSubtitle = () => {
    switch (makeupMode) {
      case 'camera':
        return 'Makeup trực tiếp với camera'
      case 'upload':
        return 'Tải ảnh lên để thử makeup'
      case 'suggestion':
        return 'Nhận gợi ý makeup theo tông da'
      default:
        return 'Áp dụng makeup ảo ngay trong trình duyệt'
    }
  }

  // Render Makeup Screen (existing UI)
  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto px-6 py-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBackToHome}>
          <span className="text-lg">←</span>
        </Button>
        <div className="flex-1 text-center">
          <h1 className="text-3xl font-bold">💄 Virtual Makeup</h1>
          <p className="text-muted-foreground">{getMakeupSubtitle()}</p>
        </div>
        <div className="w-10" />
      </header>

      {/* Only show mode switch controls if no mode was pre-selected from home */}
      {!makeupMode && (
        <div className="container mx-auto px-6 pb-4 flex flex-wrap gap-3 justify-center">
          <label>
            <input
              ref={uploadInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelected}
              className="hidden"
            />
            <Button variant="outline" size="lg" asChild>
              <span className="cursor-pointer">Chọn ảnh</span>
            </Button>
          </label>
          {isCameraActive ? (
            <Button variant="destructive" size="lg" onClick={stopCameraStream}>
              Tắt camera
            </Button>
          ) : (
            <Button variant="default" size="lg" onClick={startCamera}>
              Bật camera
            </Button>
          )}
          <label>
            <input
              ref={suggestionInputRef}
              type="file"
              accept="image/*"
              onChange={handleSuggestionImageUpload}
              className="hidden"
            />
            <Button variant="outline" size="lg" asChild className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 hover:from-orange-500/20 hover:to-pink-500/20 border-orange-500/30">
              <span className="cursor-pointer">✨ Gợi ý makeup</span>
            </Button>
          </label>
        </div>
      )}

      {/* Show simplified controls when mode is pre-selected */}
      {makeupMode && (
        <div className="container mx-auto px-6 pb-4 flex flex-wrap gap-3 justify-center">
          {makeupMode === 'camera' && (
            <>
              {isCameraActive ? (
                <Button variant="destructive" size="lg" onClick={stopCameraStream}>
                  Tắt camera
                </Button>
              ) : (
                <Button variant="default" size="lg" onClick={startCamera}>
                  Bật camera
                </Button>
              )}
              {isCameraActive && (
                <Button
                  variant={isComparing ? "default" : "outline"}
                  size="lg"
                  onClick={() => {
                    // For camera mode, we use live video/canvas, no need to capture snapshots
                    setIsComparing(!isComparing);
                  }}
                  className={isComparing ? "bg-gradient-to-r from-pink-600 to-purple-600" : ""}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  {isComparing ? "Đang so sánh" : "So sánh"}
                </Button>
              )}
            </>
          )}
          {makeupMode === 'upload' && (
            <>
              <label>
                <input
                  ref={uploadInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <Button variant="outline" size="lg" asChild>
                  <span className="cursor-pointer">Chọn ảnh khác</span>
                </Button>
              </label>
              {uploadedImageElement && (
                <Button
                  variant={isComparing ? "default" : "outline"}
                  size="lg"
                  onClick={() => {
                    if (!isComparing) {
                      // Entering compare mode
                      const canvas = canvasRef.current;

                      // Capture before snapshot (original uploaded image)
                      if (!beforeSnapshot && uploadedImageElement) {
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = uploadedImageElement.naturalWidth;
                        tempCanvas.height = uploadedImageElement.naturalHeight;
                        const tempCtx = tempCanvas.getContext('2d');
                        if (tempCtx) {
                          tempCtx.drawImage(uploadedImageElement, 0, 0);
                          setBeforeSnapshot(tempCanvas.toDataURL('image/png'));
                        }
                      }

                      // Capture after snapshot (canvas with makeup)
                      if (canvas && canvas.width > 0 && canvas.height > 0) {
                        setAfterSnapshot(canvas.toDataURL('image/png'));
                      }

                      setTimeout(() => setIsComparing(true), 50);
                    } else {
                      setIsComparing(false);
                    }
                  }}
                  className={isComparing ? "bg-gradient-to-r from-pink-600 to-purple-600" : ""}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  {isComparing ? "Đang so sánh" : "So sánh"}
                </Button>
              )}
            </>
          )}
          {makeupMode === 'suggestion' && (
            <>
              <label>
                <input
                  ref={suggestionInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSuggestionImageUpload}
                  className="hidden"
                />
                <Button variant="outline" size="lg" asChild className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 hover:from-orange-500/20 hover:to-pink-500/20 border-orange-500/30">
                  <span className="cursor-pointer">✨ Chọn ảnh khác</span>
                </Button>
              </label>
              {suggestionImageElement && (
                <Button
                  variant={isComparing ? "default" : "outline"}
                  size="lg"
                  onClick={() => {
                    if (!isComparing) {
                      // Entering compare mode
                      const canvas = canvasRef.current;

                      // Capture before snapshot (original suggestion image)
                      if (!beforeSnapshot && suggestionImageElement) {
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = suggestionImageElement.naturalWidth;
                        tempCanvas.height = suggestionImageElement.naturalHeight;
                        const tempCtx = tempCanvas.getContext('2d');
                        if (tempCtx) {
                          tempCtx.drawImage(suggestionImageElement, 0, 0);
                          setBeforeSnapshot(tempCanvas.toDataURL('image/png'));
                        }
                      }

                      // Capture after snapshot (canvas with makeup)
                      if (canvas && canvas.width > 0 && canvas.height > 0) {
                        setAfterSnapshot(canvas.toDataURL('image/png'));
                      }

                      setTimeout(() => setIsComparing(true), 50);
                    } else {
                      setIsComparing(false);
                    }
                  }}
                  className={isComparing ? "bg-gradient-to-r from-pink-600 to-purple-600" : ""}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  {isComparing ? "Đang so sánh" : "So sánh"}
                </Button>
              )}
            </>
          )}
        </div>
      )}

      <div className="container mx-auto px-6 pb-12 grid lg:grid-cols-[400px_1fr] gap-6 items-start">
        <Card className="lg:sticky lg:top-6 max-h-[calc(100vh-200px)] overflow-hidden flex flex-col">
          <CardHeader className="border-b space-y-3">
            <CardTitle>Sản phẩm</CardTitle>
            {!selectedProductId && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 pr-8 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {productSearchQuery && (
                  <button
                    onClick={() => setProductSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4">
            {appliedMakeupEntries.length > 0 && (
              <div className="mb-4 space-y-3 rounded-lg border bg-primary/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Sản phẩm đang thử</h3>
                  <Badge variant="secondary" className="text-xs">{appliedMakeupEntries.length}</Badge>
                </div>
                <div className="space-y-2">
                  {appliedMakeupEntries.map(([groupKey, item]) => {
                    const groupLabel = FEATURE_GROUPS.find((group) => group.key === groupKey)?.label || 'Makeup'
                    const productImage = item.product.image_url ? resolveMediaUrl(item.product.image_url) : ''
                    const isOutOfStock = isVariantOutOfStock(item.variant)

                    return (
                      <div key={`${groupKey}-${item.product.id}-${item.variant.id}`} className="rounded-lg border bg-background p-2">
                        <div className="flex gap-3">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={item.product.name}
                              className="h-14 w-14 flex-shrink-0 rounded-md object-cover"
                            />
                          ) : (
                            <div className="h-14 w-14 flex-shrink-0 rounded-md bg-muted" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-xs text-muted-foreground">{groupLabel}</p>
                                <p className="line-clamp-2 text-sm font-medium leading-tight">{item.product.name}</p>
                              </div>
                              {item.variant.shade_hex && (
                                <div
                                  className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-white shadow-sm"
                                  style={{ background: item.variant.shade_hex }}
                                />
                              )}
                            </div>
                            <div className="mt-1 flex items-center justify-between gap-2">
                              <p className="truncate text-xs text-muted-foreground">{item.variant.name || 'Default'}</p>
                              <p className="text-sm font-semibold text-primary">{formatPrice(item.variant.price)}</p>
                            </div>
                            {isOutOfStock && (
                              <p className="mt-1 text-xs font-medium text-destructive">Hết hàng</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => router.push(`/product/${item.product.slug || item.product.id}`)}
                          >
                            <ExternalLink className="mr-1 h-3.5 w-3.5" />
                            Chi tiết
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            disabled={isOutOfStock || isAddingToCart}
                            onClick={() => handleAddTriedProductToCart(item.product, item.variant)}
                          >
                            {isAddingToCart ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <ShoppingCart className="mr-1 h-3.5 w-3.5" />}
                            Giỏ
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 px-2 text-xs"
                            disabled={isOutOfStock}
                            onClick={() => handleBuyTriedProduct(item.product, item.variant)}
                          >
                            <ShoppingBag className="mr-1 h-3.5 w-3.5" />
                            Mua
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedProductId ? (
            /* Product Detail View */
            (() => {
              // Tìm product từ API products
              let product: Product | undefined
              for (const products of apiProducts.values()) {
                product = products.find((p) => p.id === selectedProductId)
                if (product) break
              }

              if (!product) return null
              const brand = MOCK_BRANDS.find((b) => b.id === product.brand_id)
              const activeVariants = product.variants || []
              const selectedVariant = activeVariants.find((variant: any) => selectedVariantId === `${product.id}-${variant.id}`)
              const appliedVariant = appliedMakeup.get(product.group)?.product.id === product.id
                ? appliedMakeup.get(product.group)?.variant
                : null
              const triedVariant = selectedVariant || appliedVariant || null
              const priceRange = '' // Price info not in new API response

              return (
                <div className="space-y-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProductId(null)}
                  >
                    ← Quay lại
                  </Button>

                  <div>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    {brand && <p className="text-sm text-muted-foreground">{brand.name}</p>}
                    <div className="flex items-center gap-3 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <span>⭐</span>
                        <span>{Number(product.avg_rating || 0).toFixed(1)}</span>
                        <span className="text-muted-foreground">({product.review_count} đánh giá)</span>
                      </div>
                      {priceRange && <span className="text-muted-foreground">{priceRange}</span>}
                    </div>
                  </div>

                  {product.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
                  )}

                  <div className="flex justify-between items-center py-2 border-t">
                    <span className="font-medium">Chọn màu</span>
                    <Badge variant="secondary">{activeVariants.length} màu</Badge>
                  </div>

                  <div className="space-y-2">
                    {activeVariants.map((variant: any) => {
                      const variantId = `${product.id}-${variant.id}`
                      const isActive = selectedVariantId === variantId
                      const isDisabled = !variant.shade_hex
                      return (
                        <button
                          key={variant.id}
                          type="button"
                          disabled={isDisabled}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${isDisabled
                              ? 'border-border bg-muted/50 opacity-50 cursor-not-allowed'
                              : isActive
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-accent'
                            }`}
                          onClick={() => !isDisabled && handleSelectVariant(product, variant)}
                        >
                          {variant.shade_hex ? (
                            <div
                              className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                              style={{ background: variant.shade_hex }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">N/A</span>
                            </div>
                          )}
                          <div className="flex-1 text-left">
                            <p className="font-medium text-sm">{variant.name}</p>
                            {variant.opacity != null && (
                              <p className="text-sm text-muted-foreground">Độ mờ: {Math.round(variant.opacity * 100)}%</p>
                            )}
                            {isDisabled && (
                              <p className="text-xs text-muted-foreground italic">Không có màu</p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {triedVariant && (
                    <div className="space-y-3 rounded-lg border bg-primary/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">Màu đang thử</p>
                          <p className="truncate text-sm font-medium">{triedVariant.name || 'Default'}</p>
                        </div>
                        <p className="text-sm font-semibold text-primary">{formatPrice(triedVariant.price)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isVariantOutOfStock(triedVariant) || isAddingToCart}
                          onClick={() => handleAddTriedProductToCart(product, triedVariant)}
                        >
                          {isAddingToCart ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                          Thêm giỏ
                        </Button>
                        <Button
                          size="sm"
                          disabled={isVariantOutOfStock(triedVariant)}
                          onClick={() => handleBuyTriedProduct(product, triedVariant)}
                        >
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Mua ngay
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()
          ) : (
            /* Product List View */
            <div className="space-y-2">
              {isLoadingProducts ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Đang tải sản phẩm...</p>
                </div>
              ) : (
                FEATURE_GROUPS.map((group) => {
                  const allGroupProducts = apiProducts.get(group.key) || []

                  // Filter products based on search query
                  const groupProducts = productSearchQuery
                    ? allGroupProducts.filter((product) => {
                      const searchLower = productSearchQuery.toLowerCase()
                      const productName = product.name.toLowerCase()
                      const brand = MOCK_BRANDS.find((b) => b.id === product.brand_id)
                      const brandName = brand?.name.toLowerCase() || ''
                      return productName.includes(searchLower) || brandName.includes(searchLower)
                    })
                    : allGroupProducts

                  if (groupProducts.length === 0) return null

                  const isExpanded = expandedProductGroup === group.key
                  const hasSelectedVariant = groupProducts.some((p) =>
                    (p.variants || []).some((v: any) => selectedVariantId === `${p.id}-${v.id}`)
                  )

                  const groupIcon = {
                    'LIPS': '💄',
                    'EYESHADOW': '👁️',
                    'BLUSH': '🌸',
                    'FOUNDATION': '✨',
                    'EYELINER': '✏️',
                    'EYEBROWS': '🖌️',
                    'MASCARA': '🪮'
                  }[group.key] || '✨'

                  return (
                    <div key={group.key} className="border rounded-lg overflow-hidden bg-card">
                      <button
                        type="button"
                        className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${isExpanded ? 'bg-primary/5' : 'hover:bg-accent'
                          }`}
                        onClick={() => handleToggleGroup(group.key, isExpanded, groupProducts.length)}
                      >
                        <span className="text-xl">{groupIcon}</span>
                        <span className="flex-1 font-medium">{group.label}</span>
                        <Badge variant="secondary" className="text-xs">{groupProducts.length}</Badge>
                        <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                      </button>
                      {isExpanded && (
                        <div className="p-2 space-y-2 bg-muted/30">{groupProducts.map((product) => {
                          const brand = MOCK_BRANDS.find((b) => b.id === product.brand_id)
                          const activeVariants = product.variants || []
                          const variantsWithColor = activeVariants.filter((v: any) => v.shade_hex)
                          const hasSelected = activeVariants.some((v: any) => selectedVariantId === `${product.id}-${v.id}`)
                          const isApplied = appliedMakeup.has(group.key) && appliedMakeup.get(group.key)?.product.id === product.id
                          const appliedVariant = isApplied ? appliedMakeup.get(group.key)?.variant : null
                          const previewColors = variantsWithColor.slice(0, 5)
                          const moreCount = Math.max(0, variantsWithColor.length - 5)

                          return (
                            <div key={product.id} className={`relative ${isApplied ? 'bg-primary/5 rounded-lg p-1' : ''}`}>
                              <button
                                type="button"
                                className={`w-full p-2.5 rounded-lg border transition-all ${hasSelected || isApplied
                                  ? 'border-primary bg-background'
                                  : 'border-transparent bg-background hover:border-border'
                                  }`}
                                onClick={() => { setSelectedProductId(product.id) }}
                              >
                                <div className="flex items-start gap-3">
                                  {product.image_url ? (
                                    <img
                                      src={resolveMediaUrl(product.image_url)}
                                      alt={product.name}
                                      className="w-12 h-12 rounded object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                      <span className="text-xl">{(group as any).icon}</span>
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="font-medium text-sm leading-tight line-clamp-2">{product.name}</p>
                                    {brand && <p className="text-xs text-muted-foreground truncate mt-0.5">{brand.name}</p>}
                                    {!isApplied && (
                                      <div className="flex gap-0.5 mt-1.5 flex-wrap">
                                        {previewColors.slice(0, 4).map((v: any) => (
                                          <div
                                            key={v.id}
                                            className="w-4 h-4 rounded-full border border-white/50 flex-shrink-0"
                                            style={{ background: v.shade_hex }}
                                          />
                                        ))}
                                        {variantsWithColor.length > 4 && (
                                          <span className="text-[10px] text-muted-foreground self-center ml-0.5">+{variantsWithColor.length - 4}</span>
                                        )}
                                      </div>
                                    )}
                                    {isApplied && appliedVariant && (
                                      <div className="flex items-center gap-1.5 mt-1.5">
                                        {appliedVariant.shade_hex && (
                                          <div
                                            className="w-5 h-5 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                                            style={{ background: appliedVariant.shade_hex }}
                                          />
                                        )}
                                        <Badge variant="default" className="text-[10px] px-1.5 py-0.5">Đang dùng</Badge>
                                      </div>
                                    )}
                                  </div>
                                  {!isApplied && (
                                    <span className="text-muted-foreground flex-shrink-0 self-center">›</span>
                                  )}
                                </div>
                              </button>
                              {isApplied && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute top-2 right-2 h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveMakeup(group.key)
                                  }}
                                  title="Gỡ bỏ makeup"
                                >
                                  <span className="text-sm">✕</span>
                                </Button>
                              )}
                            </div>
                          )
                        })}
                        </div>
                      )}
                    </div>
                  )
                }))}
            </div>
          )}
          </CardContent>
        </Card>

        {/* Hidden: Feature customization panel - keeping code for potential future use */}
        {/* <section className="feature-panel">
        <h2>Tùy chỉnh lớp makeup</h2>
        <div className="feature-options">
          <label className="feature-option-toggle">
            <input
              type="checkbox"
              checked={showLandmarks}
              onChange={(event) => setShowLandmarks(event.target.checked)}
            />
            <span>Hiển thị điểm nhận diện khuôn mặt</span>
          </label>
        </div>
        <div className="feature-grid">
          {FEATURE_GROUPS.map((group) => {
            const primaryFeature = group.featureNames[0]
            const primarySettings = featureSettings[primaryFeature]
            const groupEnabled = group.featureNames.every(
              (name) => featureSettings[name]?.enabled,
            )
            const colorValue = primarySettings?.color ?? '#ff4d8d'
            const alphaValue = primarySettings?.alpha ?? 0.5

            return (
              <div
                key={group.key}
                className={`feature-card${groupEnabled ? ' feature-card--active' : ''}`}
              >
                <div className="feature-card__header">
                  <label className="feature-card__toggle">
                    <input
                      type="checkbox"
                      checked={groupEnabled}
                      onChange={() => handleToggleGroup(group.key)}
                    />
                    <span>{group.label}</span>
                  </label>
                  <input
                    type="color"
                    value={colorValue}
                    onChange={(event) =>
                      handleGroupColorChange(group.key, event.target.value)
                    }
                    aria-label={`Chọn màu cho ${group.label}`}
                  />
                </div>
                <label className="feature-card__slider">
                  <span>Độ đậm</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={alphaValue}
                    onChange={(event) =>
                      handleGroupAlphaChange(group.key, Number(event.target.value))
                    }
                    disabled={!groupEnabled}
                  />
                  <span className="feature-card__value">
                    {Math.round(alphaValue * 100)}%
                  </span>
                </label>
              </div>
            )
          })}
        </div>
      </section> */}

        {/* Hidden: Face Analysis Panel - keeping code for potential future use */}
        {/* {(faceAnalysis.skinTone || faceAnalysis.faceShape || faceAnalysis.lipShape) && (
        <section className="analysis-panel">
          <h2>Phân tích khuôn mặt</h2>
          <div className="analysis-grid">
            {faceAnalysis.skinTone && (
              <div className="analysis-card">
                <div className="analysis-card__header">
                  <span className="analysis-card__icon">🎨</span>
                  <h3>Tông da (Skin Tone)</h3>
                </div>
                <div className="analysis-card__content">
                  <div 
                    className="analysis-card__swatch"
                    style={{ backgroundColor: faceAnalysis.skinToneColor || SKIN_TONES[faceAnalysis.skinTone].hexColor }}
                  />
                  <div className="analysis-card__info">
                    <span className="analysis-card__label">{SKIN_TONES[faceAnalysis.skinTone].label}</span>
                    <span className="analysis-card__color">{faceAnalysis.skinToneColor}</span>
                  </div>
                </div>
              </div>
            )}
            {faceAnalysis.faceShape && (
              <div className="analysis-card">
                <div className="analysis-card__header">
                  <span className="analysis-card__icon">👤</span>
                  <h3>Hình dáng khuôn mặt (Face Shape)</h3>
                </div>
                <div className="analysis-card__content">
                  <div className="analysis-card__info">
                    <span className="analysis-card__label">{FACE_SHAPES[faceAnalysis.faceShape].label}</span>
                    <span className="analysis-card__description">{FACE_SHAPES[faceAnalysis.faceShape].description}</span>
                  </div>
                </div>
              </div>
            )}
            {faceAnalysis.lipShape && (
              <div className="analysis-card">
                <div className="analysis-card__header">
                  <span className="analysis-card__icon">💋</span>
                  <h3>Hình dáng môi (Lip Shape)</h3>
                </div>
                <div className="analysis-card__content">
                  <div className="analysis-card__info">
                    <span className="analysis-card__label">{LIP_SHAPES[faceAnalysis.lipShape].label}</span>
                    <span className="analysis-card__description">{LIP_SHAPES[faceAnalysis.lipShape].description}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )} */}

        {/* Compare view for upload/suggestion mode - static images */}
        {isComparing && makeupMode !== 'camera' && beforeSnapshot && afterSnapshot ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Before */}
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2 text-center border-b">
                <CardTitle className="text-lg">Trước</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full aspect-[4/3] bg-muted/30">
                  <img src={beforeSnapshot} alt="Before makeup" className="absolute inset-0 w-full h-full object-contain" />
                </div>
              </CardContent>
            </Card>
            {/* After */}
            <Card className="relative overflow-hidden border-pink-500 border-2">
              <CardHeader className="pb-2 text-center border-b bg-gradient-to-r from-pink-50 to-purple-50">
                <CardTitle className="text-lg bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Sau</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full aspect-[4/3] bg-muted/30">
                  <img src={afterSnapshot} alt="After makeup" className="absolute inset-0 w-full h-full object-contain" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Camera compare view - live video and canvas side by side */}
        {isComparing && makeupMode === 'camera' && isCameraActive ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Before - Live video without makeup */}
            <Card className="relative overflow-hidden">
              <CardHeader className="pb-2 text-center border-b">
                <CardTitle className="text-lg">Trước</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full aspect-[4/3] bg-muted/30 overflow-hidden">
                  <video
                    ref={compareVideoRef}
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ transform: 'scaleX(-1)' }}
                    playsInline
                    muted
                    autoPlay
                  />
                </div>
              </CardContent>
            </Card>
            {/* After - Live canvas with makeup (copied from main canvas) */}
            <Card className="relative overflow-hidden border-pink-500 border-2">
              <CardHeader className="pb-2 text-center border-b bg-gradient-to-r from-pink-50 to-purple-50">
                <CardTitle className="text-lg bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">Sau</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full aspect-[4/3] bg-muted/30">
                  <canvas ref={compareCanvasRef} className="absolute inset-0 w-full h-full object-contain" style={{ transform: 'scaleX(-1)' }} />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* Main camera/image view - hidden when comparing */}
        <Card className={`relative overflow-hidden ${isComparing ? 'hidden' : ''}`}>
          <div className="relative w-full aspect-[4/3] max-h-[calc(100vh-250px)] bg-muted/30">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-contain"
              style={makeupMode === 'camera' ? { transform: 'scaleX(-1)' } : undefined}
            />
            {!isCameraActive && !uploadedImageElement && !suggestionImageElement && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center p-8 bg-muted/50 z-10">
                <div className="text-7xl opacity-70 animate-pulse">📸</div>
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Sẵn sàng thử makeup
                </h3>
                <p className="text-muted-foreground">
                  {makeupMode === 'camera' && 'Bấm "Bật camera" để bắt đầu'}
                  {makeupMode === 'upload' && 'Bấm "Chọn ảnh" để tải ảnh lên'}
                  {makeupMode === 'suggestion' && 'Bấm "Chọn ảnh" để nhận gợi ý makeup'}
                  {!makeupMode && 'Chọn một chế độ bên trên để bắt đầu'}
                </p>
              </div>
            )}
            {(statusMessage || errorMessage) && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex flex-col gap-2">
                {statusMessage && (
                  <Badge variant="secondary" className="backdrop-blur-md bg-purple-500/20 border-purple-500/40 text-purple-100 px-4 py-2">
                    {statusMessage}
                  </Badge>
                )}
                {errorMessage && (
                  <Badge variant="destructive" className="backdrop-blur-md px-4 py-2">
                    {errorMessage}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Suggestion Modal */}
      {showSuggestionModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={closeSuggestionModal}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="relative border-b">
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-4 right-4"
                onClick={closeSuggestionModal}
              >
                ✕
              </Button>
              <CardTitle className="text-center text-2xl">✨ Gợi ý Makeup theo Tông Da</CardTitle>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto p-6">
              {suggestionImage && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img src={suggestionImage} alt="Ảnh phân tích" className="w-full h-auto" />
                </div>
              )}

              {!suggestedSkinTone ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="font-medium mb-2">Đang phân tích tông da...</p>
                  <p className="text-sm text-muted-foreground">Đảm bảo ảnh có khuôn mặt rõ ràng, nhìn thẳng và đủ sáng</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <div
                      className="w-16 h-16 rounded-full border-4 border-white shadow-lg shrink-0"
                      style={{ backgroundColor: suggestedSkinColor || SKIN_TONES[suggestedSkinTone].hexColor }}
                    />
                    <div>
                      <h3 className="font-medium text-muted-foreground text-sm">Tông da của bạn</h3>
                      <p className="text-xl font-semibold">{SKIN_TONES[suggestedSkinTone].label}</p>
                      <p className="text-sm text-muted-foreground">{suggestedSkinColor}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Màu makeup gợi ý</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {suggestedSkinTone && Object.entries(MAKEUP_SUGGESTIONS[suggestedSkinTone]).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                          <div
                            className="w-10 h-10 rounded-full border-2 border-white shadow-sm shrink-0"
                            style={{ backgroundColor: value.color }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {key === 'lips' ? 'Môi' :
                                key === 'eyeshadow' ? 'Phấn mắt' :
                                  key === 'blush' ? 'Má hồng' :
                                    key === 'eyeliner' ? 'Kẻ mắt' :
                                      key === 'foundation' ? 'Phấn nền' :
                                        key === 'mascara' ? 'Mascara' : 'Lông mày'}
                            </p>
                            <p className="text-sm font-medium truncate">{value.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {suggestedProducts.size > 0 && (
                    <div>
                      <h3 className="font-semibold mb-3">Sản phẩm phù hợp</h3>
                      <div className="space-y-3">
                        {Array.from(suggestedProducts.entries()).map(([groupKey, suggestedProduct]) => {
                          const brand = MOCK_BRANDS.find((b) => b.id === suggestedProduct.product.brand_id)
                          const groupLabel =
                            groupKey === 'LIPS' ? 'Môi' :
                              groupKey === 'EYESHADOW' ? 'Phấn mắt' :
                                groupKey === 'BLUSH' ? 'Má hồng' :
                                  groupKey === 'EYELINER' ? 'Kẻ mắt' :
                                    groupKey === 'FOUNDATION' ? 'Phấn nền' :
                                      groupKey === 'MASCARA' ? 'Mascara' : 'Lông mày'

                          return (
                            <div key={groupKey} className="p-4 bg-muted/30 rounded-lg">
                              <Badge variant="secondary" className="mb-2">{groupLabel}</Badge>
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-12 h-12 rounded-full border-2 border-white shadow-sm shrink-0"
                                  style={{ backgroundColor: suggestedProduct.variant.shade_hex || '#ccc' }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{suggestedProduct.product.name}</p>
                                  {brand && <p className="text-xs text-muted-foreground truncate">{brand.name}</p>}
                                  <p className="text-sm text-muted-foreground truncate">{suggestedProduct.variant.name}</p>
                                  <p className="text-sm font-semibold text-primary">{formatPrice(suggestedProduct.variant.price)}</p>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                    size="lg"
                    onClick={applySuggestedMakeup}
                  >
                    🎨 Áp dụng gợi ý makeup
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      {renderVrReviewPrompt()}
    </div>
  )
}

// Exported above as default function
