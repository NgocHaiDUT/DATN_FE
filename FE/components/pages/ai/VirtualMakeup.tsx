"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Camera, Upload, Sparkles, RotateCcw, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Product, MakeupState, MakeupSettings } from "@/types/makeup.types";
import { mockProducts, getProductsByCategory } from "@/lib/makeup-products";
import {
  loadMediaPipeScripts,
  extractFaceLandmarks,
  drawMakeup,
} from "@/lib/face-detection";

type MakeupMode = "camera" | "upload" | "suggestions";

export function VirtualMakeup() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [mode, setMode] = useState<MakeupMode>(() => {
    const modeParam = searchParams.get("mode");
    return (modeParam as MakeupMode) || "camera";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedMakeup, setSelectedMakeup] = useState<MakeupState>(() => {
    const lipstickId = searchParams.get("lipstick");
    const eyeshadowId = searchParams.get("eyeshadow");
    const blushId = searchParams.get("blush");
    const makeup: MakeupState = {};
    
    if (lipstickId) {
      const product = mockProducts.find(p => p.id === lipstickId);
      if (product) makeup.lipstick = product;
    }
    if (eyeshadowId) {
      const product = mockProducts.find(p => p.id === eyeshadowId);
      if (product) makeup.eyeshadow = product;
    }
    if (blushId) {
      const product = mockProducts.find(p => p.id === blushId);
      if (product) makeup.blush = product;
    }
    
    return makeup;
  });
  const [settings, setSettings] = useState<MakeupSettings>(() => {
    const lipstickOpacity = searchParams.get("lipstickOpacity");
    const eyeshadowOpacity = searchParams.get("eyeshadowOpacity");
    const blushOpacity = searchParams.get("blushOpacity");
    
    return {
      lipstickOpacity: lipstickOpacity ? parseFloat(lipstickOpacity) : 0.6,
      eyeshadowOpacity: eyeshadowOpacity ? parseFloat(eyeshadowOpacity) : 0.5,
      blushOpacity: blushOpacity ? parseFloat(blushOpacity) : 0.4,
      eyelinerOpacity: 0.7,
      foundationOpacity: 0.3,
    };
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faceMeshRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // Update URL with current state
  const updateUrl = useCallback((updates: {
    mode?: MakeupMode;
    lipstick?: string | null;
    eyeshadow?: string | null;
    blush?: string | null;
    lipstickOpacity?: number;
    eyeshadowOpacity?: number;
    blushOpacity?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (updates.mode !== undefined) {
      params.set("mode", updates.mode);
    }
    if (updates.lipstick !== undefined) {
      if (updates.lipstick) {
        params.set("lipstick", updates.lipstick);
      } else {
        params.delete("lipstick");
      }
    }
    if (updates.eyeshadow !== undefined) {
      if (updates.eyeshadow) {
        params.set("eyeshadow", updates.eyeshadow);
      } else {
        params.delete("eyeshadow");
      }
    }
    if (updates.blush !== undefined) {
      if (updates.blush) {
        params.set("blush", updates.blush);
      } else {
        params.delete("blush");
      }
    }
    if (updates.lipstickOpacity !== undefined) {
      params.set("lipstickOpacity", updates.lipstickOpacity.toString());
    }
    if (updates.eyeshadowOpacity !== undefined) {
      params.set("eyeshadowOpacity", updates.eyeshadowOpacity.toString());
    }
    if (updates.blushOpacity !== undefined) {
      params.set("blushOpacity", updates.blushOpacity.toString());
    }
    
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Initialize camera for live mode
  const initializeCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await loadMediaPipeScripts();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

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

  // Process face detection results
  const onResults = useCallback(
    (results: any) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let source: HTMLVideoElement | HTMLImageElement | null = null;
      
      if (mode === "camera" && videoRef.current) {
        source = videoRef.current;
        canvas.width = source.videoWidth;
        canvas.height = source.videoHeight;
      } else if (mode === "upload" && imageRef.current) {
        source = imageRef.current;
        canvas.width = source.width;
        canvas.height = source.height;
      }

      if (!source) return;

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

      const landmarks = extractFaceLandmarks(results);
      if (landmarks) {
        drawMakeup(ctx, landmarks, {
          lipstick: selectedMakeup.lipstick
            ? {
                color: selectedMakeup.lipstick.color,
                opacity: settings.lipstickOpacity,
              }
            : undefined,
          eyeshadow: selectedMakeup.eyeshadow
            ? {
                color: selectedMakeup.eyeshadow.color,
                opacity: settings.eyeshadowOpacity,
              }
            : undefined,
          blush: selectedMakeup.blush
            ? {
                color: selectedMakeup.blush.color,
                opacity: settings.blushOpacity,
              }
            : undefined,
        });
      }

      ctx.restore();
    },
    [selectedMakeup, settings, mode]
  );

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      const imageUrl = event.target?.result as string;
      setUploadedImage(imageUrl);

      // Process the uploaded image
      if (imageRef.current) {
        imageRef.current.onload = async () => {
          await loadMediaPipeScripts();
          
          if (window.FaceMesh && imageRef.current) {
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

              faceMeshRef.current.onResults(onResults);
            }

            await faceMeshRef.current.send({ image: imageRef.current });
          }
          setIsLoading(false);
        };
      }
    };

    reader.readAsDataURL(file);
  };

  // Select product
  const selectProduct = (product: Product) => {
    setSelectedMakeup((prev) => ({
      ...prev,
      [product.category]: product,
    }));
    
    // Update URL with selected product
    updateUrl({
      [product.category]: product.id,
    } as any);
  };

  // Reset makeup
  const resetMakeup = () => {
    setSelectedMakeup({});
    
    // Clear URL parameters for makeup
    updateUrl({
      lipstick: null,
      eyeshadow: null,
      blush: null,
    });
  };

  // Take screenshot
  const takeScreenshot = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `makeup-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  // Switch mode
  const switchMode = (newMode: MakeupMode) => {
    // Stop camera if switching away from camera mode
    if (mode === "camera" && newMode !== "camera") {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      setIsCameraActive(false);
    }

    setMode(newMode);
    setError(null);
    
    // Update URL with new mode
    updateUrl({ mode: newMode });
  };

  // Get makeup suggestions based on face analysis
  const getSuggestions = () => {
    // Mock suggestions - in real app, this would call AI API
    return [
      {
        category: "lipstick" as const,
        products: getProductsByCategory("lipstick").slice(0, 2),
        reason: "Your lip shape is perfect for bold colors",
      },
      {
        category: "eyeshadow" as const,
        products: getProductsByCategory("eyeshadow").slice(0, 2),
        reason: "These shades complement your eye color",
      },
      {
        category: "blush" as const,
        products: getProductsByCategory("blush").slice(0, 2),
        reason: "Natural tones that suit your skin tone",
      },
    ];
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
    };
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Mode Selector */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          onClick={() => switchMode("camera")}
          className="flex-1"
        >
          <Camera className="w-4 h-4 mr-2" />
          Live Camera
        </Button>
        <Button
          variant={mode === "upload" ? "default" : "outline"}
          onClick={() => switchMode("upload")}
          className="flex-1"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Photo
        </Button>
        <Button
          variant={mode === "suggestions" ? "default" : "outline"}
          onClick={() => switchMode("suggestions")}
          className="flex-1"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI Suggestions
        </Button>
      </div>

      {/* Camera Mode */}
      {mode === "camera" && (
        <div className="flex-1 flex flex-col">
          <Card className="p-4 flex-1 flex flex-col">
            <div className="relative flex-1 bg-gray-900 rounded-lg overflow-hidden">
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
                    <Button onClick={initializeCamera} size="lg">
                      <Camera className="w-5 h-5 mr-2" />
                      Start Camera
                    </Button>
                  )}
                </div>
              )}

              <video ref={videoRef} className="hidden" playsInline muted />
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
            </div>

            {isCameraActive && (
              <div className="flex gap-2 mt-4">
                <Button onClick={takeScreenshot} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={resetMakeup} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Upload Mode */}
      {mode === "upload" && (
        <div className="flex-1 flex flex-col">
          <Card className="p-4 flex-1 flex flex-col">
            <div className="relative flex-1 bg-gray-900 rounded-lg overflow-hidden">
              {!uploadedImage ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
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
                      Choose Photo
                    </Button>
                    <p className="text-sm text-gray-400 mt-2">
                      Upload a photo to try on makeup
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
                  <img
                    ref={imageRef}
                    src={uploadedImage}
                    alt="Uploaded"
                    className="hidden"
                  />
                  <canvas ref={canvasRef} className="w-full h-full object-contain" />
                </>
              )}
            </div>

            {uploadedImage && (
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Change Photo
                </Button>
                <Button onClick={takeScreenshot} variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={resetMakeup} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Suggestions Mode */}
      {mode === "suggestions" && (
        <div className="flex-1 overflow-y-auto">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-pink-500" />
              AI Makeup Recommendations
            </h3>
            <p className="text-gray-600 mb-6">
              Based on your facial features and skin tone, here are our AI-powered recommendations:
            </p>

            <div className="space-y-6">
              {getSuggestions().map((suggestion, index) => (
                <div key={index} className="border-b pb-6 last:border-b-0">
                  <h4 className="font-semibold text-lg capitalize mb-2">
                    {suggestion.category}
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">{suggestion.reason}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {suggestion.products.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => selectProduct(product)}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          selectedMakeup[product.category]?.id === product.id
                            ? "border-pink-500 bg-pink-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-full border-2 border-white shadow-md flex-shrink-0"
                            style={{ backgroundColor: product.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.brand}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
              <p className="text-sm text-gray-700">
                💡 <strong>Tip:</strong> Switch to Camera or Upload mode to try on these recommended products!
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Product Selection Panel (for camera and upload modes) */}
      {(mode === "camera" || mode === "upload") && (
        <div className="mt-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Select Products</h3>
            <Tabs defaultValue="lipstick" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="lipstick">Lips</TabsTrigger>
                <TabsTrigger value="eyeshadow">Eyes</TabsTrigger>
                <TabsTrigger value="blush">Cheeks</TabsTrigger>
              </TabsList>

              <TabsContent value="lipstick" className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                {getProductsByCategory("lipstick").map((product) => (
                  <ProductItem
                    key={product.id}
                    product={product}
                    isSelected={selectedMakeup.lipstick?.id === product.id}
                    onSelect={selectProduct}
                  />
                ))}
              </TabsContent>

              <TabsContent value="eyeshadow" className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                {getProductsByCategory("eyeshadow").map((product) => (
                  <ProductItem
                    key={product.id}
                    product={product}
                    isSelected={selectedMakeup.eyeshadow?.id === product.id}
                    onSelect={selectProduct}
                  />
                ))}
              </TabsContent>

              <TabsContent value="blush" className="space-y-2 mt-4 max-h-48 overflow-y-auto">
                {getProductsByCategory("blush").map((product) => (
                  <ProductItem
                    key={product.id}
                    product={product}
                    isSelected={selectedMakeup.blush?.id === product.id}
                    onSelect={selectProduct}
                  />
                ))}
              </TabsContent>
            </Tabs>

            {/* Intensity Controls */}
            {Object.keys(selectedMakeup).length > 0 && (
              <div className="mt-4 space-y-3 pt-4 border-t">
                <h4 className="font-semibold text-sm">Adjust Intensity</h4>
                {selectedMakeup.lipstick && (
                  <div>
                    <label className="text-xs text-gray-600">
                      Lipstick: {Math.round(settings.lipstickOpacity * 100)}%
                    </label>
                    <Slider
                      value={[settings.lipstickOpacity]}
                      onValueChange={([value]) => {
                        setSettings((s) => ({ ...s, lipstickOpacity: value }));
                        updateUrl({ lipstickOpacity: value });
                      }}
                      min={0}
                      max={1}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                )}
                {selectedMakeup.eyeshadow && (
                  <div>
                    <label className="text-xs text-gray-600">
                      Eyeshadow: {Math.round(settings.eyeshadowOpacity * 100)}%
                    </label>
                    <Slider
                      value={[settings.eyeshadowOpacity]}
                      onValueChange={([value]) => {
                        setSettings((s) => ({ ...s, eyeshadowOpacity: value }));
                        updateUrl({ eyeshadowOpacity: value });
                      }}
                      min={0}
                      max={1}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                )}
                {selectedMakeup.blush && (
                  <div>
                    <label className="text-xs text-gray-600">
                      Blush: {Math.round(settings.blushOpacity * 100)}%
                    </label>
                    <Slider
                      value={[settings.blushOpacity]}
                      onValueChange={([value]) => {
                        setSettings((s) => ({ ...s, blushOpacity: value }));
                        updateUrl({ blushOpacity: value });
                      }}
                      min={0}
                      max={1}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// Product Item Component
function ProductItem({
  product,
  isSelected,
  onSelect,
}: {
  product: Product;
  isSelected: boolean;
  onSelect: (product: Product) => void;
}) {
  return (
    <button
      onClick={() => onSelect(product)}
      className={`w-full p-3 rounded-lg border-2 transition-all ${
        isSelected
          ? "border-pink-500 bg-pink-50"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-2 border-white shadow-md flex-shrink-0"
          style={{ backgroundColor: product.color }}
        />
        <div className="flex-1 text-left min-w-0">
          <p className="font-medium text-sm truncate">{product.name}</p>
          <p className="text-xs text-gray-500">{product.brand}</p>
        </div>
        {product.price && (
          <p className="text-sm font-semibold text-pink-600">
            ${product.price}
          </p>
        )}
      </div>
    </button>
  );
}
