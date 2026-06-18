"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Play } from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nContext';
import { resolveMediaUrl } from '@/lib/media';

// -------------------- Types --------------------
interface ImageItem {
    url: string;
    type?: 'image' | 'video';
}

interface ImageGalleryProps {
    images?: ImageItem[];
    currentIndex?: number;
    isOpen?: boolean;
    onClose?: () => void;
}

// -------------------- Component --------------------
const ImageGallery: React.FC<ImageGalleryProps> = ({
    images = [],
    currentIndex = 0,
    isOpen = false,
    onClose = () => { },
}) => {
    const [activeIndex, setActiveIndex] = useState<number>(currentIndex);
    const [zoom, setZoom] = useState<number>(1);
    const [rotation, setRotation] = useState<number>(0);
    const { t } = useI18n();

    useEffect(() => {
        setActiveIndex(currentIndex);
    }, [currentIndex]);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!isOpen) return;
            switch (e.key) {
                case 'Escape':
                    onClose();
                    break;
                case 'ArrowLeft':
                    goToPrevious();
                    break;
                case 'ArrowRight':
                    goToNext();
                    break;
                case '+':
                case '=':
                    setZoom(prev => Math.min(prev + 0.2, 3));
                    break;
                case '-':
                    setZoom(prev => Math.max(prev - 0.2, 0.5));
                    break;
                case 'r':
                case 'R':
                    setRotation(prev => (prev + 90) % 360);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyPress);
        return () => document.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, onClose]);

    const goToPrevious = () => {
        setActiveIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
        resetTransform();
    };

    const goToNext = () => {
        setActiveIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
        resetTransform();
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
    const handleRotate = () => setRotation(prev => (prev + 90) % 360);
    const resetTransform = () => {
        setZoom(1);
        setRotation(0);
    };

    if (!isOpen || images.length === 0) return null;

    const currentImage = images[activeIndex];
    if (!currentImage) return null;

    const getImageUrl = (image: ImageItem) => resolveMediaUrl(image.url);

    const imageUrl = getImageUrl(currentImage);

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
            {/* Close Button */}
            <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={onClose}
            >
                <X className="h-6 w-6" />
            </Button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20"
                        onClick={goToPrevious}
                    >
                        <ChevronLeft className="h-8 w-8" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:bg-white/20"
                        onClick={goToNext}
                    >
                        <ChevronRight className="h-8 w-8" />
                    </Button>
                </>
            )}

            {/* Controls */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={handleRotate}>
                    <RotateCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={resetTransform}>
                    Reset
                </Button>
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 text-white bg-black/50 px-3 py-1 rounded">
                    {activeIndex + 1} / {images.length}
                </div>
            )}

            {/* Main Media */}
            <div className="flex items-center justify-center w-full h-full p-4">
                {currentImage.type === 'video' ? (
                    <video
                        src={imageUrl}
                        controls
                        className="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
                        style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                    >
                        {t('common.videoNotSupported')}
                    </video>
                ) : (
                    <img
                        src={imageUrl}
                        alt={`Image ${activeIndex + 1}`}
                        className="max-w-full max-h-full object-contain transition-transform duration-200"
                        style={{ transform: `scale(${zoom}) rotate(${rotation}deg)`, cursor: zoom > 1 ? 'grab' : 'default' }}
                        draggable={false}
                    />
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="flex gap-2 max-w-4xl overflow-x-auto px-4">
                        {images.map((image: ImageItem, index: number) => {
                            const thumbUrl = getImageUrl(image);
                            return (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setActiveIndex(index);
                                        resetTransform();
                                    }}
                                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all relative ${index === activeIndex ? 'border-white' : 'border-transparent hover:border-white/50'
                                        }`}
                                >
                                    {image.type === 'video' ? (
                                        <>
                                            <video src={thumbUrl} className="w-full h-full object-cover" muted />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Play className="h-4 w-4 text-white" />
                                            </div>
                                        </>
                                    ) : (
                                        <img src={thumbUrl} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="absolute bottom-4 right-4 z-10 text-white/70 text-xs">
                <p>{t('common.galleryHint')}</p>
            </div>
        </div>
    );
};

export default ImageGallery;
