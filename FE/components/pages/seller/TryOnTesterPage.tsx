"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Camera,
  Upload,
  Download,
  Share2,
  RotateCcw,
  Palette,
  Image as ImageIcon,
  Loader2,
  Save,
  Pencil,
  Check,
  X,
  GitCompare,
  MessageSquareText
} from "lucide-react";
import { ImageWithFallback } from "@/components/common/ImageWithFallback";
import { fetchMyShopProductsByCategories, MakeupProduct, ProductVariant, formatPrice, updateVariantShade } from "@/services/makeup.service";
import { VrReviewDialog } from "@/components/common/VrReviewDialog";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { toast } from "sonner";
import {
  getVrReviewPromptStatus,
  getVrReviewUnavailableMessage,
} from "@/lib/vr-review";
import { FeatureGroupKey, FEATURE_CONFIGS, FEATURE_GROUPS } from "@/lib/faceFeatures";
import {
  loadMediaPipeScripts,
  drawMakeupWithFeatures,
  FeatureStateMap,
} from "@/lib/face-detection";

// Category labels in Vietnamese
const CATEGORY_LABELS: Record<FeatureGroupKey, string> = {
  LIPS: "Son môi",
  EYESHADOW: "Phấn mắt",
  BLUSH: "Má hồng",
  EYELINER: "Kẻ mắt",
  EYEBROWS: "Lông mày",
  FOUNDATION: "Nền",
  MASCARA: "Mascara",
};

// All 7 categories in order
const ALL_CATEGORIES: FeatureGroupKey[] = [
  "LIPS",
  "EYESHADOW", 
  "BLUSH",
  "EYELINER",
  "EYEBROWS",
  "FOUNDATION",
  "MASCARA",
];

const presetModels = [
  {
    id: 1,
    name: "Mẫu 1",
    skinTone: "Light",
    image: "/assets/images/mau-1.jpg"
  },
  {
    id: 2,
    name: "Mẫu 2",
    skinTone: "Medium",
    image: "/assets/images/mau-2.jpg"
  },
  {
    id: 3,
    name: "Mẫu 3",
    skinTone: "Deep",
    image: "/assets/images/mau-3.jpg"
  }
];

type MakeupMode = "camera" | "upload" | "sample";

// Selected makeup state for each category
type SelectedMakeupState = {
  [key in FeatureGroupKey]?: {
    product: MakeupProduct;
    variant: ProductVariant;
    opacity: number;
  };
};

const DEFAULT_TRY_ON_OPACITY = 0.6;

// Helper function to convert selectedMakeup to FeatureStateMap for full makeup drawing
const createFeatureStateMap = (selectedMakeup: SelectedMakeupState): FeatureStateMap => {
  const featureSettings: Partial<FeatureStateMap> = {};
  
  // Initialize all features as disabled
  FEATURE_CONFIGS.forEach(({ name, color, alpha }) => {
    featureSettings[name] = {
      enabled: false,
      color: `#${color.split(',').map(c => parseInt(c.trim()).toString(16).padStart(2, '0')).join('')}`,
      alpha,
    };
  });

  // Map selected products to their corresponding features
  FEATURE_GROUPS.forEach((group) => {
    const makeupData = selectedMakeup[group.key];
    if (makeupData) {
      const color = makeupData.variant.shade_hex || '#FF0000';
      const opacity = makeupData.opacity;
      
      // Enable all features in this group with the selected color
      group.featureNames.forEach((featureName) => {
        featureSettings[featureName] = {
          enabled: true,
          color: color,
          alpha: opacity,
        };
      });
    }
  });

  return featureSettings as FeatureStateMap;
};

export function TryOnTesterPage() {
  const [mode, setMode] = useState<MakeupMode>("camera");
  const [selectedModel, setSelectedModel] = useState(presetModels[0]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // API products state
  const [apiProducts, setApiProducts] = useState<Map<FeatureGroupKey, MakeupProduct[]>>(new Map());
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  // Selected makeup for each category
  const [selectedMakeup, setSelectedMakeup] = useState<SelectedMakeupState>({});
  const [activeCategory, setActiveCategory] = useState<FeatureGroupKey>("LIPS");
  
  // Editing state for selected products
  const [editingCategory, setEditingCategory] = useState<FeatureGroupKey | null>(null);
  const [savingCategory, setSavingCategory] = useState<FeatureGroupKey | null>(null);
  
  // Before/After comparison state
  const [beforeSnapshot, setBeforeSnapshot] = useState<string | null>(null);
  const [afterSnapshot, setAfterSnapshot] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showVrReviewDialog, setShowVrReviewDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beforeCanvasRef = useRef<HTMLCanvasElement>(null); // Canvas for "before" view in camera compare mode
  const uploadCanvasRef = useRef<HTMLCanvasElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const sampleImageRef = useRef<HTMLImageElement>(null);
  const faceMeshRef = useRef<any>(null);
  const mediaPipeCameraRef = useRef<any>(null);

  // Load products from API on mount
  useEffect(() => {
    if (apiProducts.size === 0) {
      setIsLoadingProducts(true);
      fetchMyShopProductsByCategories(20)
        .then((productsMap) => {
          setApiProducts(productsMap);
          console.log('Loaded my shop products:', productsMap);
        })
        .catch((error) => {
          console.error('Failed to load products:', error);
          setApiProducts(new Map());
        })
        .finally(() => {
          setIsLoadingProducts(false);
        });
    }
  }, [apiProducts.size]);

  // Select a product variant
  const selectProductVariant = (product: MakeupProduct, variant: ProductVariant) => {
    setSelectedMakeup((prev) => ({
      ...prev,
      [product.group]: {
        product,
        variant,
        opacity: variant.opacity ?? DEFAULT_TRY_ON_OPACITY,
      },
    }));
  };

  // Update opacity for a category
  const updateOpacity = (category: FeatureGroupKey, opacity: number) => {
    setSelectedMakeup((prev) => {
      if (!prev[category]) return prev;
      return {
        ...prev,
        [category]: {
          ...prev[category]!,
          opacity,
        },
      };
    });
  };

  // Update color for a category
  const updateColor = (category: FeatureGroupKey, color: string) => {
    setSelectedMakeup((prev) => {
      if (!prev[category]) return prev;
      return {
        ...prev,
        [category]: {
          ...prev[category]!,
          variant: {
            ...prev[category]!.variant,
            shade_hex: color,
          },
        },
      };
    });
  };

  // Save variant changes to API
  const saveVariantChanges = async (category: FeatureGroupKey) => {
    const data = selectedMakeup[category];
    if (!data) return;
    
    // Skip if it's a custom variant (negative ID)
    if (data.variant.id < 0) {
      alert("Không thể lưu màu tùy chọn. Vui lòng chọn một biến thể sản phẩm có sẵn.");
      setEditingCategory(null);
      return;
    }
    
    setSavingCategory(category);
    
    try {
      const result = await updateVariantShade(data.variant.id, {
        shade_hex: data.variant.shade_hex || "#FF0000",
        opacity: data.opacity,
      });
      
      if (result.success) {
        const updatedVariant = result.data;

        // Update the variant in apiProducts if needed
        setApiProducts((prev) => {
          const newMap = new Map(prev);
          const products = newMap.get(category);
          if (products) {
            const updatedProducts = products.map((product) => {
              if (product.id === data.product.id) {
                return {
                  ...product,
                  variants: product.variants.map((v) =>
                    v.id === data.variant.id
                      ? {
                          ...v,
                          shade_hex: updatedVariant?.shade_hex ?? data.variant.shade_hex,
                          opacity: updatedVariant?.opacity ?? data.opacity,
                        }
                      : v
                  ),
                };
              }
              return product;
            });
            newMap.set(category, updatedProducts);
          }
          return newMap;
        });

        setSelectedMakeup((prev) => {
          const current = prev[category];
          if (!current || current.variant.id !== data.variant.id) return prev;

          return {
            ...prev,
            [category]: {
              ...current,
              variant: {
                ...current.variant,
                shade_hex: updatedVariant?.shade_hex ?? data.variant.shade_hex,
                opacity: updatedVariant?.opacity ?? data.opacity,
              },
              opacity: updatedVariant?.opacity ?? data.opacity,
            },
          };
        });
        
        setEditingCategory(null);
      } else {
        alert(result.message || "Lưu thất bại. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error saving variant:", error);
      alert("Có lỗi xảy ra khi lưu. Vui lòng thử lại.");
    } finally {
      setSavingCategory(null);
    }
  };

  // Remove product from category
  const removeProduct = (category: FeatureGroupKey) => {
    setSelectedMakeup((prev) => {
      const newState = { ...prev };
      delete newState[category];
      return newState;
    });
  };

  // Reset all makeup
  const resetAllMakeup = () => {
    setSelectedMakeup({});
    setBeforeSnapshot(null);
    setAfterSnapshot(null);
    setIsComparing(false);
  };

  // Capture before snapshot (original face without makeup)
  const captureBeforeSnapshot = useCallback(() => {
    // For camera mode
    if (mode === "camera" && videoRef.current) {
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      
      if (width === 0 || height === 0) return;
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        // Mirror the image for selfie view
        tempCtx.translate(width, 0);
        tempCtx.scale(-1, 1);
        tempCtx.drawImage(video, 0, 0, width, height);
        const dataUrl = tempCanvas.toDataURL('image/png');
        setBeforeSnapshot(dataUrl);
      }
    }
    // For upload mode
    else if (mode === "upload" && imageRef.current) {
      const img = imageRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width || img.naturalWidth;
      tempCanvas.height = img.height || img.naturalHeight;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        const dataUrl = tempCanvas.toDataURL('image/png');
        setBeforeSnapshot(dataUrl);
      }
    }
    // For sample mode
    else if (mode === "sample" && sampleImageRef.current) {
      const img = sampleImageRef.current;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth || img.width;
      tempCanvas.height = img.naturalHeight || img.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        const dataUrl = tempCanvas.toDataURL('image/png');
        setBeforeSnapshot(dataUrl);
      }
    }
  }, [mode]);

  // Toggle compare mode
  const toggleCompare = useCallback(() => {
    if (!isComparing) {
      // Entering compare mode
      let beforeUrl = beforeSnapshot;
      let afterUrl: string | null = null;
      
      // Capture before snapshot if not already captured
      if (!beforeUrl) {
        captureBeforeSnapshot();
        // Get the before snapshot after state update
        if (mode === "camera" && videoRef.current) {
          const video = videoRef.current;
          const width = video.videoWidth || 1280;
          const height = video.videoHeight || 720;
          if (width > 0 && height > 0) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
              tempCtx.translate(width, 0);
              tempCtx.scale(-1, 1);
              tempCtx.drawImage(video, 0, 0, width, height);
              beforeUrl = tempCanvas.toDataURL('image/png');
              setBeforeSnapshot(beforeUrl);
            }
          }
        } else if (mode === "upload" && imageRef.current) {
          const img = imageRef.current;
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = img.width || img.naturalWidth;
          tempCanvas.height = img.height || img.naturalHeight;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            beforeUrl = tempCanvas.toDataURL('image/png');
            setBeforeSnapshot(beforeUrl);
          }
        } else if (mode === "sample" && sampleImageRef.current) {
          const img = sampleImageRef.current;
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = img.naturalWidth || img.width;
          tempCanvas.height = img.naturalHeight || img.height;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
            beforeUrl = tempCanvas.toDataURL('image/png');
            setBeforeSnapshot(beforeUrl);
          }
        }
      }
      
      // Capture after snapshot from current canvas (with makeup)
      const currentCanvas = mode === "camera" ? canvasRef.current 
        : mode === "upload" ? uploadCanvasRef.current 
        : sampleCanvasRef.current;
        
      if (currentCanvas && currentCanvas.width > 0 && currentCanvas.height > 0) {
        afterUrl = currentCanvas.toDataURL('image/png');
        setAfterSnapshot(afterUrl);
      }
      
      // Enter compare mode after snapshots are set
      setTimeout(() => {
        setIsComparing(true);
      }, 100);
    } else {
      // Exiting compare mode
      setIsComparing(false);
    }
  }, [isComparing, beforeSnapshot, mode, captureBeforeSnapshot]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImage(imageUrl);
        
        // Process uploaded image with face detection
        if (imageRef.current) {
          imageRef.current.onload = async () => {
            await processUploadedImage();
          };
        }
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process uploaded image with face detection
  const processUploadedImage = useCallback(async () => {
    if (!imageRef.current || !uploadCanvasRef.current) return;

    try {
      await loadMediaPipeScripts();

      if (window.FaceMesh) {
        if (!faceMeshRef.current) {
          faceMeshRef.current = new window.FaceMesh({
            locateFile: (file: string) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
          });

          faceMeshRef.current.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        }

        // Always update callback to use latest onResults
        faceMeshRef.current.onResults((results: any) => {
          if (!uploadCanvasRef.current || !imageRef.current) return;

          const canvas = uploadCanvasRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          const source = imageRef.current;
          canvas.width = source.width;
          canvas.height = source.height;

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

          // Use full face landmarks with drawMakeupWithFeatures for all 7 categories
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            const featureSettings = createFeatureStateMap(selectedMakeup);
            drawMakeupWithFeatures(ctx, landmarks, canvas.width, canvas.height, featureSettings);
          }

          ctx.restore();
        });
        await faceMeshRef.current.send({ image: imageRef.current });
      }
    } catch (err) {
      console.error("Error processing image:", err);
    }
  }, [selectedMakeup]);

  // Process sample image with face detection
  const processSampleImage = useCallback(async () => {
    if (!sampleImageRef.current || !sampleCanvasRef.current) return;

    try {
      await loadMediaPipeScripts();

      if (window.FaceMesh) {
        if (!faceMeshRef.current) {
          faceMeshRef.current = new window.FaceMesh({
            locateFile: (file: string) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
          });

          faceMeshRef.current.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        }

        // Always update callback to use latest onResults
        faceMeshRef.current.onResults((results: any) => {
          if (!sampleCanvasRef.current || !sampleImageRef.current) return;

          const canvas = sampleCanvasRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          const source = sampleImageRef.current;
          canvas.width = source.naturalWidth || source.width;
          canvas.height = source.naturalHeight || source.height;

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

          // Use full face landmarks with drawMakeupWithFeatures for all 7 categories
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            const featureSettings = createFeatureStateMap(selectedMakeup);
            drawMakeupWithFeatures(ctx, landmarks, canvas.width, canvas.height, featureSettings);
          }

          ctx.restore();
        });
        await faceMeshRef.current.send({ image: sampleImageRef.current });
      }
    } catch (err) {
      console.error("Error processing sample image:", err);
    }
  }, [selectedMakeup]);

  // Camera onResults callback
  const onCameraResults = useCallback(
    (results: any) => {
      try {
        if (!canvasRef.current || !videoRef.current) return;
        
        // Check if video is ready
        const source = videoRef.current;
        if (!source.videoWidth || !source.videoHeight || source.readyState < 2) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = source.videoWidth;
        canvas.height = source.videoHeight;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Mirror the camera for selfie view
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform

      // Use full face landmarks with drawMakeupWithFeatures for all 7 categories
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        
        // Mirror all landmark X coordinates (normalized 0-1) for makeup to align with mirrored image
        const mirroredLandmarks = landmarks.map((p: any) => ({ ...p, x: 1 - p.x }));
        
        const featureSettings = createFeatureStateMap(selectedMakeup);
        drawMakeupWithFeatures(ctx, mirroredLandmarks, canvas.width, canvas.height, featureSettings);
      }

      ctx.restore();

      // Also draw to beforeCanvas (without makeup) when comparing in camera mode
      if (isComparing && beforeCanvasRef.current && source) {
        const beforeCanvas = beforeCanvasRef.current;
        const beforeCtx = beforeCanvas.getContext("2d");
        if (beforeCtx) {
          beforeCanvas.width = source.videoWidth;
          beforeCanvas.height = source.videoHeight;
          
          beforeCtx.save();
          beforeCtx.clearRect(0, 0, beforeCanvas.width, beforeCanvas.height);
          
          // Mirror the camera for selfie view
          beforeCtx.translate(beforeCanvas.width, 0);
          beforeCtx.scale(-1, 1);
          beforeCtx.drawImage(source, 0, 0, beforeCanvas.width, beforeCanvas.height);
          
          beforeCtx.restore();
        }
      }
      } catch (err) {
        // Silently ignore errors during canvas rendering (can happen during mode transitions)
        console.debug("Canvas render skipped:", err);
      }
    },
    [selectedMakeup, isComparing]
  );

  // Re-process when makeup changes (for upload mode)
  useEffect(() => {
    if (mode === "upload" && uploadedImage && imageRef.current) {
      processUploadedImage();
    }
  }, [selectedMakeup, mode, uploadedImage, processUploadedImage]);

  // Re-process when makeup or model changes (for sample mode)
  useEffect(() => {
    if (mode === "sample" && sampleImageRef.current && sampleImageRef.current.complete) {
      processSampleImage();
    }
  }, [selectedMakeup, mode, selectedModel, processSampleImage]);

  // Update FaceMesh callback when makeup changes (for camera mode)
  useEffect(() => {
    if (mode === "camera" && isCameraActive && faceMeshRef.current) {
      faceMeshRef.current.onResults(onCameraResults);
    }
  }, [onCameraResults, mode, isCameraActive]);

  // Update after snapshot when makeup changes while comparing
  useEffect(() => {
    if (isComparing && Object.keys(selectedMakeup).length > 0) {
      // Small delay to let the canvas update with new makeup
      const timer = setTimeout(() => {
        const currentCanvas = mode === "camera" ? canvasRef.current 
          : mode === "upload" ? uploadCanvasRef.current 
          : sampleCanvasRef.current;
          
        if (currentCanvas && currentCanvas.width > 0 && currentCanvas.height > 0) {
          const afterUrl = currentCanvas.toDataURL('image/png');
          setAfterSnapshot(afterUrl);
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [selectedMakeup, isComparing, mode]);

  const initializeCamera = useCallback(async () => {
    try {
      setIsLoading(true);

      await loadMediaPipeScripts();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (window.FaceMesh) {
        if (!faceMeshRef.current) {
          faceMeshRef.current = new window.FaceMesh({
            locateFile: (file: string) =>
              `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
          });

          faceMeshRef.current.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        }

        faceMeshRef.current.onResults(onCameraResults);
      }

      if (window.Camera && videoRef.current) {
        mediaPipeCameraRef.current = new window.Camera(videoRef.current, {
          onFrame: async () => {
            try {
              if (faceMeshRef.current && videoRef.current && videoRef.current.readyState >= 2) {
                await faceMeshRef.current.send({ image: videoRef.current });
              }
            } catch (err) {
              // Silently ignore errors during frame processing
              console.debug("Frame processing skipped:", err);
            }
          },
          width: 1280,
          height: 720,
        });

        await mediaPipeCameraRef.current.start();
      }

      setIsCameraActive(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Error initializing camera:", err);
      alert("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
      setIsLoading(false);
    }
  }, [onCameraResults]);

  const stopCamera = () => {
    // Stop MediaPipe camera first
    if (mediaPipeCameraRef.current) {
      try {
        mediaPipeCameraRef.current.stop();
      } catch (err) {
        console.debug("Error stopping MediaPipe camera:", err);
      }
      mediaPipeCameraRef.current = null;
    }
    
    // Don't close FaceMesh - keep it for reuse (closing corrupts global cache)
    // Just reset the onResults callback to prevent stale updates
    if (faceMeshRef.current) {
      try {
        faceMeshRef.current.onResults(() => {}); // Empty callback
      } catch (err) {
        console.debug("Error resetting FaceMesh callback:", err);
      }
    }
    
    // Stop video tracks
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaPipeCameraRef.current) {
        try {
          mediaPipeCameraRef.current.stop();
        } catch (err) {
          console.debug("Error stopping MediaPipe camera on unmount:", err);
        }
        mediaPipeCameraRef.current = null;
      }
      // Only close FaceMesh on unmount (component leaving)
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch (err) {
          console.debug("Error closing FaceMesh on unmount:", err);
        }
        faceMeshRef.current = null;
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const switchMode = (newMode: MakeupMode) => {
    if (mode === "camera") {
      stopCamera();
    }
    setMode(newMode);
    // Reset compare state when switching modes
    setBeforeSnapshot(null);
    setAfterSnapshot(null);
    setIsComparing(false);
  };

  const openReviewDialog = useCallback(async () => {
    try {
      const status = await getVrReviewPromptStatus();
      if (status?.should_show) {
        setShowVrReviewDialog(true);
        return;
      }
      toast.info(getVrReviewUnavailableMessage(status));
    } catch {
      setShowVrReviewDialog(true);
    }
  }, []);
  const getCurrentImage = () => {
    switch (mode) {
      case "sample":
        return selectedModel.image;
      case "upload":
        return uploadedImage || selectedModel.image;
      case "camera":
        return selectedModel.image;
      default:
        return selectedModel.image;
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💄 Thử trang điểm</h1>
          <p className="text-gray-600">Thử sản phẩm với công nghệ AR và xem trước các phong cách khác nhau</p>
        </div>
        <Button variant="outline" onClick={openReviewDialog}>
          <MessageSquareText className="w-4 h-4 mr-2" />
          Đánh giá model
        </Button>
      </div>

      {/* Mode Selector - 3 buttons at the top */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          onClick={() => switchMode("camera")}
          className="flex-1"
        >
          <Camera className="w-4 h-4 mr-2" />
          Camera trực tiếp
        </Button>
        <Button
          variant={mode === "upload" ? "default" : "outline"}
          onClick={() => switchMode("upload")}
          className="flex-1"
        >
          <Upload className="w-4 h-4 mr-2" />
          Chọn ảnh
        </Button>
        <Button
          variant={mode === "sample" ? "default" : "outline"}
          onClick={() => switchMode("sample")}
          className="flex-1"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          Dùng ảnh mẫu
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)] min-h-0">
        {/* Main Preview Area */}
        <Card className="lg:col-span-2 flex flex-col h-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Xem trước AR</CardTitle>
              <div className="flex items-center gap-2">
                {/* Compare button - show when there are selected products and camera/image is active */}
                {Object.keys(selectedMakeup).length > 0 && (isCameraActive || uploadedImage || mode === "sample") && (
                  <Button
                    onClick={toggleCompare}
                    variant={isComparing ? "default" : "outline"}
                    size="sm"
                    className={isComparing ? "bg-gradient-to-r from-pink-600 to-purple-600" : ""}
                  >
                    <GitCompare className="w-4 h-4 mr-1" />
                    {isComparing ? "Đang so sánh" : "So sánh"}
                  </Button>
                )}
                {Object.keys(selectedMakeup).length > 0 && (
                  <Badge variant="outline">
                    <Palette className="w-3 h-3 mr-1" />
                    {Object.keys(selectedMakeup).length} sản phẩm
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Hidden video element - always present for MediaPipe camera */}
            <video
              ref={videoRef}
              className="hidden"
              playsInline
              muted
            />

            {/* Live Camera Compare View - for camera mode */}
            {isComparing && mode === "camera" && isCameraActive && (
              <div className="flex flex-col min-h-0 h-full">
                <div className="grid grid-cols-2 gap-4 h-[500px]">
                  {/* Before - Live camera without makeup */}
                  <div className="space-y-2 flex flex-col h-full">
                    <h4 className="text-sm font-semibold text-gray-700 text-center flex items-center justify-center gap-2 flex-shrink-0">
                      Trước
                      <span className="flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded-full text-xs">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        LIVE
                      </span>
                    </h4>
                    <div className="relative flex-1 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-300">
                      <canvas 
                        ref={beforeCanvasRef}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  {/* After - Live camera with makeup */}
                  <div className="space-y-2 flex flex-col h-full">
                    <h4 className="text-sm font-semibold text-gray-700 text-center flex items-center justify-center gap-2 flex-shrink-0">
                      Sau
                      <span className="flex items-center gap-1 bg-pink-500 text-white px-2 py-0.5 rounded-full text-xs">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        LIVE
                      </span>
                    </h4>
                    <div className="relative flex-1 bg-gray-900 rounded-lg overflow-hidden border-2 border-pink-500">
                      <canvas 
                        ref={canvasRef}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => setIsComparing(false)} variant="outline" className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Quay lại
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => {
                    if (canvasRef.current) {
                      const link = document.createElement("a");
                      link.download = `makeup-comparison-${Date.now()}.png`;
                      link.href = canvasRef.current.toDataURL('image/png');
                      link.click();
                    }
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    Lưu ảnh sau
                  </Button>
                </div>
              </div>
            )}

            {/* Static Image Compare View - for upload and sample modes */}
            {isComparing && mode !== "camera" && beforeSnapshot && afterSnapshot && (
              <div className="flex flex-col min-h-0 h-full">
                <div className="grid grid-cols-2 gap-4 h-[500px]">
                  {/* Before */}
                  <div className="space-y-2 flex flex-col h-full">
                    <h4 className="text-sm font-semibold text-gray-700 text-center flex-shrink-0">Trước</h4>
                    <div className="relative flex-1 bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-300 min-h-0">
                      <img
                        src={beforeSnapshot}
                        alt="Trước khi makeup"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  {/* After */}
                  <div className="space-y-2 flex flex-col h-full">
                    <h4 className="text-sm font-semibold text-gray-700 text-center flex-shrink-0">Sau</h4>
                    <div className="relative flex-1 bg-gray-900 rounded-lg overflow-hidden border-2 border-pink-500 min-h-0">
                      <img
                        src={afterSnapshot}
                        alt="Sau khi makeup"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => setIsComparing(false)} variant="outline" className="flex-1">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Quay lại
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => {
                    if (afterSnapshot) {
                      const link = document.createElement("a");
                      link.download = `makeup-comparison-${Date.now()}.png`;
                      link.href = afterSnapshot;
                      link.click();
                    }
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    Lưu ảnh sau
                  </Button>
                </div>
              </div>
            )}

            {/* Camera Mode - hidden when comparing but still renders */}
            {mode === "camera" && !isComparing && (
              <div className="flex flex-col min-h-0 h-full">
                <div className="relative h-[500px] bg-gray-900 rounded-lg overflow-hidden">
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      {isLoading ? (
                        <div className="text-center text-white">
                          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                          <p>Đang khởi động camera...</p>
                        </div>
                      ) : (
                        <Button onClick={initializeCamera} size="lg">
                          <Camera className="w-5 h-5 mr-2" />
                          Bật Camera
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Canvas showing makeup result */}
                  <canvas 
                    ref={canvasRef} 
                    className={isCameraActive ? "w-full h-full object-contain" : "hidden"} 
                  />

                  {isCameraActive && (
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-sm">TRỰC TIẾP</span>
                      </div>
                    </div>
                  )}
                </div>

                {isCameraActive && (
                  <div className="flex gap-2 mt-4">
                    <Button onClick={stopCamera} variant="outline" className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Tắt Camera
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Upload Mode - hidden when comparing but still renders */}
            {mode === "upload" && (
              <div className={`flex flex-col min-h-0 h-full ${isComparing ? 'hidden' : ''}`}>
                <div className="relative h-[500px] bg-gray-900 rounded-lg overflow-hidden">
                  {!uploadedImage ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          size="lg"
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Chọn ảnh
                        </Button>
                        <p className="text-sm text-gray-400 mt-2">
                          Tải lên một bức ảnh để thử trang điểm
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-50">
                          <Loader2 className="w-12 h-12 animate-spin text-white" />
                        </div>
                      )}
                      {/* Hidden image for face detection */}
                      <img
                        ref={imageRef}
                        src={uploadedImage}
                        alt="Source"
                        className="hidden"
                        crossOrigin="anonymous"
                      />
                      {/* Canvas showing makeup result */}
                      <canvas 
                        ref={uploadCanvasRef}
                        className="w-full h-full object-contain"
                      />
                    </>
                  )}
                </div>

                {uploadedImage && (
                  <div className="flex gap-2 mt-4">
                    <Button onClick={() => setUploadedImage(null)} variant="outline" className="flex-1">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Đặt lại
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Sample Mode - hidden when comparing but still renders */}
            {mode === "sample" && (
              <div className={`flex flex-col min-h-0 h-full ${isComparing ? 'hidden' : ''}`}>
                <div className="relative h-[500px] bg-gray-900 rounded-lg overflow-hidden">
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-50">
                      <Loader2 className="w-12 h-12 animate-spin text-white" />
                    </div>
                  )}
                  {/* Hidden image for face detection */}
                  <img
                    ref={sampleImageRef}
                    src={selectedModel.image}
                    alt="Sample"
                    className="hidden"
                    crossOrigin="anonymous"
                    onLoad={() => processSampleImage()}
                  />
                  {/* Canvas showing makeup result */}
                  <canvas 
                    ref={sampleCanvasRef}
                    className="w-full h-full object-contain"
                  />
                </div>

              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls Panel */}
        <Card className="lg:col-span-1 flex flex-col h-full min-h-0 overflow-hidden">
          <CardHeader className="flex-shrink-0">
            <div className="flex justify-between items-center">
              <CardTitle>Chọn sản phẩm</CardTitle>
              {Object.keys(selectedMakeup).length > 0 && (
                <Button variant="ghost" size="sm" onClick={resetAllMakeup}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Đặt lại
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {/* Sample Model Selection (only in sample mode) */}
            {mode === "sample" && (
              <div className="mb-4 flex-shrink-0">
                <h4 className="text-gray-900 mb-3 font-semibold">Chọn mẫu</h4>
                <div className="grid grid-cols-3 gap-2">
                  {presetModels.map((model) => (
                    <div
                      key={model.id}
                      onClick={() => setSelectedModel(model)}
                      className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedModel.id === model.id ? 'border-pink-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={model.image}
                        alt={model.name}
                        className="w-full h-20 object-cover"
                      />
                      <div className="p-2 text-center">
                        <p className="text-xs text-gray-900">{model.name}</p>
                        <p className="text-xs text-gray-500">{model.skinTone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoadingProducts && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                <span className="ml-2 text-gray-600">Đang tải sản phẩm...</span>
              </div>
            )}

            {/* Product Categories - 7 tabs */}
            {!isLoadingProducts && (
              <Tabs 
                value={activeCategory} 
                onValueChange={(val) => setActiveCategory(val as FeatureGroupKey)} 
                className="flex-1 flex flex-col overflow-hidden"
              >
                <TabsList className="grid grid-cols-4 gap-1 h-auto flex-shrink-0">
                  {ALL_CATEGORIES.slice(0, 4).map((cat) => (
                    <TabsTrigger 
                      key={cat} 
                      value={cat}
                      className="text-xs px-2 py-1.5 data-[state=active]:bg-pink-500 data-[state=active]:text-white"
                    >
                      {CATEGORY_LABELS[cat]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsList className="grid grid-cols-3 gap-1 h-auto mt-1 flex-shrink-0">
                  {ALL_CATEGORIES.slice(4).map((cat) => (
                    <TabsTrigger 
                      key={cat} 
                      value={cat}
                      className="text-xs px-2 py-1.5 data-[state=active]:bg-pink-500 data-[state=active]:text-white"
                    >
                      {CATEGORY_LABELS[cat]}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Products for each category */}
                {ALL_CATEGORIES.map((category) => (
                  <TabsContent 
                    key={category} 
                    value={category} 
                    className="mt-3 flex-1 min-h-0 overflow-y-auto pr-2"
                  >
                    <div className="space-y-2">
                      {apiProducts.get(category)?.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <p>Không có sản phẩm trong danh mục này</p>
                        </div>
                      )}
                      {apiProducts.get(category)?.map((product) => (
                        <div key={product.id} className="space-y-2">
                            {/* Product Header */}
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{product.name}</p>
                                <p className="text-xs text-gray-500">
                                  {product.variants.length} màu
                                </p>
                              </div>
                            </div>
                            
                            {/* Variants as color swatches */}
                            <div className="flex flex-wrap gap-2 pl-2">
                              {product.variants.map((variant) => {
                                const isSelected = selectedMakeup[category]?.product.id === product.id && 
                                                   selectedMakeup[category]?.variant.id === variant.id;
                                return (
                                  <button
                                    key={variant.id}
                                    onClick={() => selectProductVariant(product, variant)}
                                    className={`relative group flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                                      isSelected
                                        ? "border-pink-500 bg-pink-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                                  >
                                    <div
                                      className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                                      style={{ backgroundColor: variant.shade_hex || "#ccc" }}
                                    />
                                    <span className="text-xs text-gray-600 mt-1 truncate max-w-[60px]">
                                      {variant.name || "Mặc định"}
                                    </span>
                                    {variant.price && (
                                      <span className="text-xs text-pink-600 font-medium">
                                        {formatPrice(variant.price)}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                              
                              {/* Custom color picker button */}
                              <label
                                className={`relative group flex flex-col items-center p-2 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                                  selectedMakeup[category]?.product.id === product.id
                                    ? "border-pink-400 bg-pink-50/50"
                                    : "border-gray-300 hover:border-pink-300 hover:bg-gray-50"
                                }`}
                              >
                                <div className="w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center bg-gradient-to-br from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400">
                                  <span className="text-white text-xs font-bold drop-shadow">+</span>
                                </div>
                                <span className="text-xs text-gray-500 mt-1">Tùy chọn</span>
                                <input
                                  type="color"
                                  defaultValue={selectedMakeup[category]?.variant.shade_hex || "#FF0000"}
                                  onChange={(e) => {
                                    // Select this product with custom color based on first variant
                                    const baseVariant = product.variants[0];
                                    if (!baseVariant) return;
                                    
                                    const customVariant: ProductVariant = {
                                      ...baseVariant,
                                      id: -Math.abs(product.id), // Negative ID for custom variant
                                      name: "Màu tùy chọn",
                                      shade_hex: e.target.value,
                                    };
                                    setSelectedMakeup((prev) => ({
                                      ...prev,
                                      [product.group]: {
                                        product,
                                        variant: customVariant,
                                        opacity: baseVariant.opacity ?? prev[product.group]?.opacity ?? DEFAULT_TRY_ON_OPACITY,
                                      },
                                    }));
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  title="Chọn màu tùy ý"
                                />
                              </label>
                            </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}

            {/* Selected Products & Opacity Controls - Compact horizontal badges */}
            {Object.keys(selectedMakeup).length > 0 && (
              <div className="mt-3 pt-3 border-t flex-shrink-0 max-h-[250px] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm text-gray-700">Đang áp dụng</h4>
                  <span className="text-xs text-gray-500">{Object.keys(selectedMakeup).length} sản phẩm</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(selectedMakeup).map(([category, data]) => (
                    <div key={category} className="space-y-2">
                      {/* Product Badge Row */}
                      <div 
                        className="group relative inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-full pl-1 pr-2 py-1 hover:shadow-md transition-all"
                      >
                        {/* Color swatch */}
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm ring-1 ring-pink-300"
                          style={{ backgroundColor: data.variant.shade_hex || "#ccc" }}
                        />
                        <span className="text-xs font-medium text-gray-700">
                          {CATEGORY_LABELS[category as FeatureGroupKey]}
                        </span>
                        
                        {/* Edit button */}
                        <button
                          onClick={() => setEditingCategory(editingCategory === category ? null : category as FeatureGroupKey)}
                          className={`ml-1 w-5 h-5 flex items-center justify-center rounded-full transition-colors ${
                            editingCategory === category 
                              ? 'bg-pink-500 text-white' 
                              : 'bg-gray-200 hover:bg-pink-400 hover:text-white text-gray-500'
                          }`}
                          title={editingCategory === category ? "Đóng chỉnh sửa" : "Chỉnh sửa"}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        
                        {/* Remove button */}
                        <button
                          onClick={() => removeProduct(category as FeatureGroupKey)}
                          className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-red-400 hover:text-white text-gray-500 transition-colors"
                          title="Xóa"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {/* Expanded Edit Panel */}
                      {editingCategory === category && (
                        <div className="ml-2 p-3 bg-white border border-pink-200 rounded-lg shadow-sm space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Chỉnh sửa {CATEGORY_LABELS[category as FeatureGroupKey]}</span>
                            {data.variant.id > 0 && (
                              <span className="text-xs text-gray-400">ID: {data.variant.id}</span>
                            )}
                          </div>
                          
                          {/* Color Picker */}
                          <div className="flex items-center gap-3">
                            <label className="text-xs text-gray-600 w-16">Màu sắc:</label>
                            <label className="relative cursor-pointer flex items-center gap-2 flex-1">
                              <div
                                className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                                style={{ backgroundColor: data.variant.shade_hex || "#ccc" }}
                              />
                              <input
                                type="color"
                                value={data.variant.shade_hex || "#FF0000"}
                                onChange={(e) => updateColor(category as FeatureGroupKey, e.target.value)}
                                className="absolute left-0 w-8 h-8 opacity-0 cursor-pointer"
                              />
                              <span className="text-xs font-mono text-gray-600 uppercase">
                                {data.variant.shade_hex || "#FFFFFF"}
                              </span>
                            </label>
                          </div>
                          
                          {/* Opacity Slider */}
                          <div className="flex items-center gap-3">
                            <label className="text-xs text-gray-600 w-16">Cường độ:</label>
                            <Slider
                              value={[data.opacity]}
                              onValueChange={([value]) =>
                                updateOpacity(category as FeatureGroupKey, value)
                              }
                              min={0}
                              max={1}
                              step={0.05}
                              className="flex-1"
                            />
                            <span className="text-xs text-gray-600 w-10 text-right font-medium">
                              {Math.round(data.opacity * 100)}%
                            </span>
                          </div>
                          
                          {/* Save Button - Only show for real variants (positive ID) */}
                          {data.variant.id > 0 && (
                            <div className="flex items-center gap-2 pt-2 border-t">
                              <Button
                                size="sm"
                                onClick={() => saveVariantChanges(category as FeatureGroupKey)}
                                disabled={savingCategory === category}
                                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                              >
                                {savingCategory === category ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang lưu...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Lưu thay đổi
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingCategory(null)}
                                className="px-3"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                          
                          {/* Info for custom colors (negative ID) */}
                          {data.variant.id < 0 && (
                            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                              💡 Màu tùy chỉnh chỉ áp dụng trong phiên làm việc này
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <VrReviewDialog
        open={showVrReviewDialog}
        source="shop_try_on_tester"
        onOpenChange={setShowVrReviewDialog}
      />
    </div>
  );
}


