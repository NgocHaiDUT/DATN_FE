"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, Download, RotateCcw, Loader2, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { MakeupState, MakeupSettings } from "@/types/makeup.types";
import {
  loadMediaPipeScripts,
  extractFaceLandmarks,
  drawMakeup,
} from "@/lib/face-detection";
import {
  fetchProductsByCategories,
  fetchProductDetails,
  MakeupProduct,
  ProductVariant,
  formatPrice
} from "@/services/makeup.service";
import type { FeatureGroupKey } from "@/lib/faceFeatures";

// Map categories to feature groups
const CATEGORY_MAP: Record<string, FeatureGroupKey> = {
  lipstick: 'LIPS',
  eyeshadow: 'EYESHADOW',
  blush: 'BLUSH',
  eyeliner: 'EYELINER',
  foundation: 'FOUNDATION',
};

export function MakeupAR() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [products, setProducts] = useState<Map<FeatureGroupKey, MakeupProduct[]>>(new Map());
  const [selectedProducts, setSelectedProducts] = useState<Map<FeatureGroupKey, { product: MakeupProduct; variant: ProductVariant }>>
    (new Map());
  const [settings, setSettings] = useState<MakeupSettings>({
    lipstickOpacity: 0.6,
    eyeshadowOpacity: 0.5,
    blushOpacity: 0.4,
    eyelinerOpacity: 0.7,
    foundationOpacity: 0.3,
  });
  const [beforeSnapshot, setBeforeSnapshot] = useState<string | null>(null);
  const [afterSnapshot, setAfterSnapshot] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const animationFrameRef = useRef<number | null>(null);

  const searchParams = useSearchParams();
  const productIdArg = searchParams.get('productId');
  const variantIdArg = searchParams.get('variantId');

  // Fetch products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const productsMap = await fetchProductsByCategories(10);
        setProducts(productsMap);

        // Auto select product from URL if provided
        if (productIdArg) {
          const productId = parseInt(productIdArg, 10);
          const variantId = variantIdArg ? parseInt(variantIdArg, 10) : null;

          let found = false;
          for (const [group, prods] of productsMap.entries()) {
            const product = prods.find(p => p.id === productId);
            if (product) {
              const variant = variantId
                ? product.variants.find(v => v.id === variantId)
                : product.variants.find(v => v.shade_hex) || product.variants[0];

              if (variant) {
                setSelectedProducts(new Map([[group, { product, variant }]]));
                found = true;
                break;
              }
            }
          }

          // If not found in primary categories, fetch specific details
          if (!found) {
            const { product, variant } = await fetchProductDetails(productId, variantId);
            if (product && variant) {
              setSelectedProducts(new Map([[product.group || 'LIPS', { product, variant }]]));
            }
          }
        }
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    };
    loadProducts();
  }, [productIdArg, variantIdArg]);

  // Initialize MediaPipe and camera
  const initializeCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

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
      setIsLoading(false);
    } catch (err) {
      console.error("Error initializing camera:", err);
      setError("Failed to access camera. Please check permissions.");
      setIsLoading(false);
    }
  }, []);

  // Capture before snapshot (original face without makeup)
  const captureBeforeSnapshot = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    // Use video dimensions directly
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    if (width === 0 || height === 0) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      tempCtx.drawImage(video, 0, 0, width, height);
      const dataUrl = tempCanvas.toDataURL('image/png');
      console.log('Captured before snapshot, length:', dataUrl.length);
      setBeforeSnapshot(dataUrl);
    }
  }, []);

  // Toggle compare mode
  const toggleCompare = useCallback(() => {
    if (!isComparing) {
      // Entering compare mode
      let beforeUrl = beforeSnapshot;
      let afterUrl: string | null = null;

      // Capture before snapshot if not already captured
      if (!beforeUrl && videoRef.current) {
        const video = videoRef.current;
        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        if (width > 0 && height > 0) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.drawImage(video, 0, 0, width, height);
            beforeUrl = tempCanvas.toDataURL('image/png');
            setBeforeSnapshot(beforeUrl);
          }
        }
      }

      // Capture after snapshot from current canvas (with makeup)
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        console.log('Canvas size:', canvas.width, 'x', canvas.height);
        if (canvas.width > 0 && canvas.height > 0) {
          // Check if canvas has actual content by sampling some pixels
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const imageData = ctx.getImageData(0, 0, 1, 1);
            console.log('Canvas sample pixel:', imageData.data);
          }
          afterUrl = canvas.toDataURL('image/png');
          console.log('After snapshot captured, length:', afterUrl.length);
          setAfterSnapshot(afterUrl);
        }
      }

      // Enter compare mode after snapshots are set
      // Use a small delay to ensure React has processed the state updates
      setTimeout(() => {
        setIsComparing(true);
      }, 100);
    } else {
      // Exiting compare mode
      setIsComparing(false);
    }
  }, [isComparing, beforeSnapshot]);

  // Process face detection results
  const onResults = useCallback(
    (results: any) => {
      if (!canvasRef.current || !videoRef.current) return;

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Capture before snapshot on first frame if not captured yet
      if (!beforeSnapshot && isCameraActive) {
        captureBeforeSnapshot();
      }

      // Draw video frame
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Extract and draw makeup
      const landmarks = extractFaceLandmarks(results);
      if (landmarks) {
        const makeupConfig: any = {};

        // Lipstick
        const lipProduct = selectedProducts.get('LIPS');
        if (lipProduct?.variant?.shade_hex) {
          makeupConfig.lipstick = {
            color: lipProduct.variant.shade_hex,
            opacity: settings.lipstickOpacity,
          };
        }

        // Eyeshadow
        const eyeProduct = selectedProducts.get('EYESHADOW');
        if (eyeProduct?.variant?.shade_hex) {
          makeupConfig.eyeshadow = {
            color: eyeProduct.variant.shade_hex,
            opacity: settings.eyeshadowOpacity,
          };
        }

        // Blush
        const blushProduct = selectedProducts.get('BLUSH');
        if (blushProduct?.variant?.shade_hex) {
          makeupConfig.blush = {
            color: blushProduct.variant.shade_hex,
            opacity: settings.blushOpacity,
          };
        }

        drawMakeup(ctx, landmarks, makeupConfig);
      }

      ctx.restore();
    },
    [selectedProducts, settings, beforeSnapshot, isCameraActive, captureBeforeSnapshot]
  );

  // Select product
  const selectProduct = (product: MakeupProduct, variant: ProductVariant) => {
    setSelectedProducts((prev) => {
      const newMap = new Map(prev);
      newMap.set(product.group, { product, variant });
      return newMap;
    });
  };

  // Reset makeup
  const resetMakeup = () => {
    setSelectedProducts(new Map());
    setBeforeSnapshot(null);
    setAfterSnapshot(null);
    setIsComparing(false);
  };

  // Take screenshot
  const takeScreenshot = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `makeup-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Virtual Makeup Studio
          </h1>
          <p className="text-gray-600">
            Try on makeup products using AI-powered virtual try-on
          </p>
        </div>

        {/* Hidden video element - always present for MediaPipe */}
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
              {/* Compare Button - Only show when camera is active */}
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

              {/* Camera/Compare View */}
              {isComparing ? (
                beforeSnapshot && afterSnapshot ? (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Before */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700 text-center">Trước</h4>
                      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-300">
                        <img
                          src={beforeSnapshot}
                          alt="Before makeup"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    {/* After */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-700 text-center">Sau</h4>
                      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden border-2 border-pink-500">
                        <img
                          src={afterSnapshot}
                          alt="After makeup"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p>Đang tải ảnh so sánh...</p>
                    </div>
                  </div>
                )
              ) : null}

              {/* Main camera view - hidden when comparing */}
              <div className={`relative aspect-video bg-gray-900 rounded-lg overflow-hidden ${isComparing ? 'hidden' : ''}`}>
                {!isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    {isLoading ? (
                      <div className="text-center text-white">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
                        <p>Initializing camera...</p>
                      </div>
                    ) : error ? (
                      <div className="text-center text-white">
                        <p className="text-red-400 mb-4">{error}</p>
                        <Button onClick={initializeCamera}>Try Again</Button>
                      </div>
                    ) : (
                      <Button
                        onClick={initializeCamera}
                        size="lg"
                        className="bg-gradient-to-r from-pink-600 to-purple-600"
                      >
                        <Camera className="w-5 h-5 mr-2" />
                        Start Camera
                      </Button>
                    )}
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Controls */}
              {isCameraActive && (
                <div className="flex gap-4 mt-4">
                  <Button
                    onClick={takeScreenshot}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Save Photo
                  </Button>
                  <Button onClick={resetMakeup} variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              )}

              {/* Intensity Controls */}
              {isCameraActive && selectedProducts.size > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="font-semibold">Adjust Intensity</h3>
                  {selectedProducts.has('LIPS') && (
                    <div>
                      <label className="text-sm text-gray-600">
                        Lipstick: {Math.round(settings.lipstickOpacity * 100)}%
                      </label>
                      <Slider
                        value={[settings.lipstickOpacity]}
                        onValueChange={([value]) =>
                          setSettings((s) => ({ ...s, lipstickOpacity: value }))
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  )}
                  {selectedProducts.has('EYESHADOW') && (
                    <div>
                      <label className="text-sm text-gray-600">
                        Eyeshadow: {Math.round(settings.eyeshadowOpacity * 100)}
                        %
                      </label>
                      <Slider
                        value={[settings.eyeshadowOpacity]}
                        onValueChange={([value]) =>
                          setSettings((s) => ({
                            ...s,
                            eyeshadowOpacity: value,
                          }))
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  )}
                  {selectedProducts.has('BLUSH') && (
                    <div>
                      <label className="text-sm text-gray-600">
                        Blush: {Math.round(settings.blushOpacity * 100)}%
                      </label>
                      <Slider
                        value={[settings.blushOpacity]}
                        onValueChange={([value]) =>
                          setSettings((s) => ({ ...s, blushOpacity: value }))
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Product Selection */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Select Products</h3>
              <Tabs defaultValue="lipstick" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="lipstick">Lips</TabsTrigger>
                  <TabsTrigger value="eyeshadow">Eyes</TabsTrigger>
                  <TabsTrigger value="blush">Cheeks</TabsTrigger>
                </TabsList>

                <TabsContent value="lipstick" className="space-y-2 mt-4">
                  {(products.get('LIPS') || []).map((product) => (
                    <ProductItem
                      key={product.id}
                      product={product}
                      isSelected={selectedProducts.get('LIPS')?.product.id === product.id}
                      onSelect={selectProduct}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="eyeshadow" className="space-y-2 mt-4">
                  {(products.get('EYESHADOW') || []).map((product) => (
                    <ProductItem
                      key={product.id}
                      product={product}
                      isSelected={selectedProducts.get('EYESHADOW')?.product.id === product.id}
                      onSelect={selectProduct}
                    />
                  ))}
                </TabsContent>

                <TabsContent value="blush" className="space-y-2 mt-4">
                  {(products.get('BLUSH') || []).map((product) => (
                    <ProductItem
                      key={product.id}
                      product={product}
                      isSelected={selectedProducts.get('BLUSH')?.product.id === product.id}
                      onSelect={selectProduct}
                    />
                  ))}
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Item Component
function ProductItem({
  product,
  isSelected,
  onSelect,
}: {
  product: MakeupProduct;
  isSelected: boolean;
  onSelect: (product: MakeupProduct, variant: ProductVariant) => void;
}) {
  // Get first variant with shade_hex or just first variant
  const variant = product.variants.find(v => v.shade_hex) || product.variants[0];

  if (!variant) return null;

  return (
    <button
      onClick={() => onSelect(product, variant)}
      className={`w-full p-3 rounded-lg border-2 transition-all ${isSelected
        ? "border-pink-500 bg-pink-50"
        : "border-gray-200 hover:border-gray-300"
        }`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full border-2 border-white shadow-md"
          style={{ backgroundColor: variant.shade_hex || '#ccc' }}
        />
        <div className="flex-1 text-left">
          <p className="font-medium text-sm">{product.name}</p>
          <p className="text-xs text-gray-500">{variant.name || 'Default'}</p>
        </div>
        <p className="text-sm font-semibold text-pink-600">
          {formatPrice(variant.price)}
        </p>
      </div>
    </button>
  );
}
