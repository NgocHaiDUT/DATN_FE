"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Camera, Loader2, GitCompare, ArrowLeft, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  loadMediaPipeScripts,
  extractFaceLandmarks,
  drawMakeup,
} from "@/lib/face-detection";
import { formatPrice } from "@/services/makeup.service";
import type { FeatureGroupKey } from "@/lib/faceFeatures";
import { FEATURE_CONFIGS } from "@/lib/faceFeatures";
import { useGetProductById } from "@/features/shop/usePublicShop";
import { resolveMediaUrl } from "@/lib/media";
import { VrReviewDialog } from "@/components/common/VrReviewDialog";
import { apiClient } from "@/lib/api";
import { ENDPOINTS } from "@/constants/endpoint";
import { toast } from "sonner";

export function ProductMakeupAR() {
  const router = useRouter();
  const params = useParams();
  const productSlug = params.slug as string;

  // Redirect if slug is undefined
  useEffect(() => {
    if (!productSlug || productSlug === 'undefined') {
      console.error('Product slug is undefined, redirecting...');
      router.push('/products');
    }
  }, [productSlug, router]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compareVideoRef = useRef<HTMLVideoElement>(null); // For "before" view in compare mode
  const compareCanvasRef = useRef<HTMLCanvasElement>(null); // For "after" view in compare mode
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showVrReviewDialog, setShowVrReviewDialog] = useState(false);

  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Fetch product using React Query hook - handles both slug and ID
  const { data: product, isLoading, error: productError } = useGetProductById(
    productSlug && productSlug !== 'undefined' ? productSlug : ''
  );

  // Get selected variant or default
  const selectedVariant = selectedVariantId && product?.variants
    ? product.variants.find((v: any) => v.id === selectedVariantId)
    : null;

  // Auto-select first variant when product loads
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0 && !selectedVariantId) {
      // Try to find variant with shade_hex, otherwise use first variant
      const defaultVariant = product.variants.find((v: any) => v.shade_hex) || product.variants[0];
      if (defaultVariant) {
        setSelectedVariantId(defaultVariant.id);
      }
    }
  }, [product, selectedVariantId]);

  // Initialize MediaPipe and camera
  const initializeCamera = useCallback(async () => {
    try {

      // Load MediaPipe scripts
      await loadMediaPipeScripts();

      // Get video stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Initialize FaceMesh
      if (window.FaceMesh) {
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

        faceMeshRef.current.onResults(onResults);
      }

      // Initialize Camera
      if (window.Camera && videoRef.current) {
        cameraRef.current = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (faceMeshRef.current && videoRef.current) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 1280,
          height: 720,
        });

        await cameraRef.current.start();
      }

      setIsCameraActive(true);
    } catch (err) {
      console.error("Error initializing camera:", err);
    }
  }, []); // Remove onResults dependency - it will be set via faceMeshRef.current.onResults

  // Toggle compare mode - using live camera feed like AIStudioMakeup
  const toggleCompare = useCallback(() => {
    setIsComparing(!isComparing);
  }, [isComparing]);

  const openReviewDialog = useCallback(async () => {
    try {
      const response: any = await apiClient(ENDPOINTS.MAKEUP.VR_REVIEW_STATUS, { method: "GET" });
      const status = response?.data || response;
      if (status?.should_show) {
        setShowVrReviewDialog(true);
        return;
      }
      const nextTime = status?.next_available_at
        ? new Date(status.next_available_at).toLocaleString("vi-VN")
        : "";
      toast.info(nextTime ? `Bạn có thể đánh giá lại sau ${nextTime}` : "Bạn đã đánh giá model trong hôm nay");
    } catch {
      setShowVrReviewDialog(true);
    }
  }, []);

  // Get makeup category from product
  const getMakeupCategory = (): FeatureGroupKey | null => {
    if (!product) return null;
    // Map category name to feature group
    const categoryName = product.category?.toLowerCase() || '';
    if (categoryName.includes('son') || categoryName.includes('lip')) return 'LIPS';
    if (categoryName.includes('phấn mắt') || categoryName.includes('eyeshadow')) return 'EYESHADOW';
    if (categoryName.includes('má hồng') || categoryName.includes('blush')) return 'BLUSH';
    if (categoryName.includes('kẻ mắt') || categoryName.includes('eyeliner')) return 'EYELINER';
    if (categoryName.includes('kem nền') || categoryName.includes('foundation')) return 'FOUNDATION';
    return 'LIPS'; // Default
  };

  // Process face detection results - matching AIStudioMakeup.tsx exactly
  const onResults = useCallback(
    (results: any) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = results.image.width;
      const height = results.image.height;

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(results.image, 0, 0, width, height);

      const landmarks = results.multiFaceLandmarks?.[0];
      if (!landmarks) {
        console.log('No face landmarks detected');
        return;
      }

      console.log('Face landmarks detected, count:', landmarks.length);

      // Get shade_hex from variant
      const shadeColor = selectedVariant ? ((selectedVariant as any).shade_hex || '#FF69B4') : '#FF69B4';
      const group = getMakeupCategory();

      if (!selectedVariant || !group) return;

      // Convert hex to RGB format
      const hexToRgb = (hex: string) => {
        const sanitized = hex.replace('#', '');
        const normalized =
          sanitized.length === 3
            ? sanitized.split('').map((char) => `${char}${char}`).join('')
            : sanitized;
        const r = parseInt(normalized.slice(0, 2), 16);
        const g = parseInt(normalized.slice(2, 4), 16);
        const b = parseInt(normalized.slice(4, 6), 16);
        return `${r},${g},${b}`;
      };

      const rgb = hexToRgb(shadeColor);

      // Import drawing functions
      const {
        drawFeature,
        drawEyebrow,
        drawMascara,
        drawEyeliner,
        drawBlush,
        drawFoundation,
      } = require('@/lib/makeup-drawing');

      // Get opacity from variant, default to 0.2 (20%) if null
      const opacity = (selectedVariant as any).opacity ?? 0.2;

      // Draw the makeup feature(s)
      if (group === 'FOUNDATION') {
        const foundationConfig = FEATURE_CONFIGS.find((c) => c.name === 'FOUNDATION');
        if (foundationConfig) {
          drawFoundation(ctx, landmarks, foundationConfig.indices, width, height, rgb, opacity);
        }
      } else if (group === 'BLUSH') {
        // Draw both left and right blush
        const blushLeft = FEATURE_CONFIGS.find((c) => c.name === 'BLUSH_LEFT');
        const blushRight = FEATURE_CONFIGS.find((c) => c.name === 'BLUSH_RIGHT');
        if (blushLeft) {
          drawBlush(ctx, landmarks, blushLeft.indices, width, height, rgb, opacity);
        }
        if (blushRight) {
          drawBlush(ctx, landmarks, blushRight.indices, width, height, rgb, opacity);
        }
      } else if (group === 'EYESHADOW') {
        // Draw both left and right eyeshadow
        const eyeshadowLeft = FEATURE_CONFIGS.find((c) => c.name === 'EYESHADOW_LEFT');
        const eyeshadowRight = FEATURE_CONFIGS.find((c) => c.name === 'EYESHADOW_RIGHT');
        if (eyeshadowLeft) {
          drawFeature(ctx, landmarks, eyeshadowLeft.indices, width, height, rgb, opacity);
        }
        if (eyeshadowRight) {
          drawFeature(ctx, landmarks, eyeshadowRight.indices, width, height, rgb, opacity);
        }
      } else if (group === 'EYELINER') {
        // Draw both left and right eyeliner
        const eyelinerLeft = FEATURE_CONFIGS.find((c) => c.name === 'EYELINER_LEFT');
        const eyelinerRight = FEATURE_CONFIGS.find((c) => c.name === 'EYELINER_RIGHT');
        if (eyelinerLeft) {
          drawEyeliner(ctx, landmarks, width, height, rgb, opacity, true);
        }
        if (eyelinerRight) {
          drawEyeliner(ctx, landmarks, width, height, rgb, opacity, false);
        }
      } else if (group === 'LIPS') {
        // Draw both upper and lower lips
        const lipUpper = FEATURE_CONFIGS.find((c) => c.name === 'LIP_UPPER');
        const lipLower = FEATURE_CONFIGS.find((c) => c.name === 'LIP_LOWER');
        if (lipUpper) {
          drawFeature(ctx, landmarks, lipUpper.indices, width, height, rgb, opacity);
        }
        if (lipLower) {
          drawFeature(ctx, landmarks, lipLower.indices, width, height, rgb, opacity);
        }
      }
    },
    [selectedVariant, getMakeupCategory]
  );



  // Cleanup
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Update FaceMesh callback when onResults changes
  useEffect(() => {
    if (faceMeshRef.current && isCameraActive) {
      console.log('🔄 Updating FaceMesh onResults callback');
      faceMeshRef.current.onResults(onResults);
    }
  }, [onResults, isCameraActive]);

  // Sync video stream to compareVideoRef when entering compare mode
  useEffect(() => {
    if (isComparing && isCameraActive && videoRef.current?.srcObject && compareVideoRef.current) {
      compareVideoRef.current.srcObject = videoRef.current.srcObject;
      compareVideoRef.current.play().catch(console.error);
    }
  }, [isComparing, isCameraActive]);

  // Copy canvas content to compareCanvasRef continuously when in compare mode
  useEffect(() => {
    if (!isComparing || !isCameraActive || !canvasRef.current || !compareCanvasRef.current) {
      return;
    }

    const sourceCanvas = canvasRef.current;
    const destCanvas = compareCanvasRef.current;
    const destCtx = destCanvas.getContext('2d');
    if (!destCtx) return;

    let frameId: number;

    const copyFrame = () => {
      if (sourceCanvas.width > 0 && sourceCanvas.height > 0) {
        destCanvas.width = sourceCanvas.width;
        destCanvas.height = sourceCanvas.height;
        destCtx.drawImage(sourceCanvas, 0, 0);
      }
      frameId = requestAnimationFrame(copyFrame);
    };

    copyFrame();

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isComparing, isCameraActive]);



  if (productError && !product && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-red-500 mb-4">Không thể tải thông tin sản phẩm</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Dùng thử {product?.name}
            </h1>
            <p className="text-gray-600">
              Trang điểm ảo với camera sử dụng AI
            </p>
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={openReviewDialog}>
              <MessageSquareText className="w-4 h-4 mr-2" />
              Đánh giá model
            </Button>
          </div>
        </div>

        {/* Hidden video element */}
        <video
          ref={videoRef}
          className="hidden"
          playsInline
          muted
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera View */}
          <div className="lg:col-span-2">
            <Card className="p-4">
              {/* Compare Button */}
              {isCameraActive && (
                <div className="mb-4 flex justify-end">
                  <Button
                    onClick={toggleCompare}
                    variant={isComparing ? "default" : "outline"}
                    className={isComparing ? "bg-gradient-to-r from-pink-600 to-purple-600" : ""}
                  >
                    <GitCompare className="w-4 h-4 mr-2" />
                    {isComparing ? "Đang so sánh" : "So sánh"}
                  </Button>
                </div>
              )}

              {/* Compare View - Live camera feed */}
              {isComparing && isCameraActive ? (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Before - Live video without makeup */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 text-center">Trước</h4>
                    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-300">
                      <video
                        ref={compareVideoRef}
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                        playsInline
                        muted
                        autoPlay
                      />
                    </div>
                  </div>
                  {/* After - Live canvas with makeup */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-700 text-center">Sau</h4>
                    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-pink-500">
                      <canvas
                        ref={compareCanvasRef}
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Main camera view */}
              <div className={`relative aspect-video bg-gray-900 rounded-lg overflow-hidden ${isComparing ? 'hidden' : ''}`}>
                {!isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    {isLoading ? (
                      <div className="text-center text-white">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                        <p>Đang tải sản phẩm...</p>
                      </div>
                    ) : product ? (
                      <Button
                        onClick={initializeCamera}
                        size="lg"
                        className="bg-gradient-to-r from-pink-600 to-purple-600"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        Bật Camera
                      </Button>
                    ) : null}
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </div>




            </Card>
          </div>

          {/* Product Info & Variants */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Thông tin sản phẩm</h3>

              {product && (
                <>
                  {/* Product Image */}
                  {product.image && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={resolveMediaUrl(product.image)}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}

                  {/* Product Name */}
                  <h4 className="font-semibold text-lg mb-2">{product.name}</h4>

                  {/* Product Description */}
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {product.description}
                    </p>
                  )}

                  {/* Variants Selection */}
                  <div className="mb-4">
                    <h5 className="font-semibold text-sm mb-3">Chọn màu sắc</h5>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {product.variants && product.variants.map((variant: any) => {
                        const hasShadeHex = variant.shade_hex && variant.shade_hex !== null;
                        return (
                          <button
                            key={variant.id}
                            onClick={() => hasShadeHex && setSelectedVariantId(variant.id)}
                            disabled={!hasShadeHex}
                            className={`w-full p-3 rounded-lg border-2 transition-all ${!hasShadeHex
                              ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                              : selectedVariantId === variant.id
                                ? "border-pink-500 bg-pink-50"
                                : "border-gray-200 hover:border-gray-300"
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              {variant.shade_hex && (
                                <div
                                  className="w-10 h-10 rounded-full border-2 border-white shadow-md flex-shrink-0"
                                  style={{ backgroundColor: variant.shade_hex }}
                                />
                              )}
                              <div className="flex-1 text-left min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {variant.name || 'Mặc định'}
                                  {!hasShadeHex && <span className="ml-2 text-xs text-red-500">(Không có màu)</span>}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatPrice(Number(variant.price))}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>


                </>
              )}
            </Card>
          </div>
        </div>
      </div>
      <VrReviewDialog
        open={showVrReviewDialog}
        source="user_product_try_on"
        onOpenChange={setShowVrReviewDialog}
      />
    </div>
  );
}
