"use client";
import React, { useState, useRef, useEffect, CSSProperties, MouseEvent } from "react";
import { Play, Pause } from "lucide-react";
import { resolveMediaUrl } from "@/lib/media";

interface VideoPlayerProps {
    src: string;
    className?: string;
    onClick?: () => void;
    onDoubleClick?: () => void;
    showControls?: boolean;
    autoPlay?: boolean;
    muted?: boolean;
    style?: CSSProperties;
    embed?: boolean; // Nếu true: dùng trong grid/thumbnail, không render blur backdrop
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    src,
    className = "",
    onClick,
    onDoubleClick,
    showControls = true,
    autoPlay = false,
    muted = false,
    style = {},
    embed = false,
}) => {
    const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const videoUrl = resolveMediaUrl(src);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            setIsLoading(false);
            setVideoDimensions({
                width: video.videoWidth,
                height: video.videoHeight,
            });
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, []);

    const togglePlay = (e: MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (!video) return;

        if (isPlaying) video.pause();
        else video.play();
    };

    const handleVideoClick = (e: MouseEvent<HTMLVideoElement>) => {
        e.stopPropagation();
        if (onClick) onClick();
    };

    const isVertical = videoDimensions.width < videoDimensions.height;

    return (
        <div className={`relative ${className}`}>
            {/* Background blur for vertical videos */}
            {isVertical && !embed && (
                <div className="absolute inset-0 bg-black" style={style}>
                    <video
                        src={videoUrl}
                        className="w-full h-full object-cover blur-sm opacity-50"
                        muted={muted}
                        loop
                        playsInline
                    />
                </div>
            )}

            {/* Main video */}
            <div
                className={`relative ${embed ? 'w-full h-full' : isVertical ? 'max-w-sm mx-auto' : 'w-full'}`}
                style={style}
            >
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className={embed ? 'w-full h-full object-cover' : `w-full h-auto object-contain ${isVertical ? 'max-h-96' : 'max-h-96'}`}
                    controls={showControls && isPlaying}
                    muted={muted}
                    playsInline
                    onClick={handleVideoClick}
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (onDoubleClick) onDoubleClick();
                    }}
                />

                {/* Play/Pause overlay */}
                {!isPlaying && (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                        onClick={togglePlay}
                    >
                        <div className="bg-black/50 rounded-full p-4 hover:bg-black/70 transition-colors">
                            <Play className="h-8 w-8 text-white" />
                        </div>
                    </div>
                )}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoPlayer;
