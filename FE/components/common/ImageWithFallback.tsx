"use client";

import React, { useState } from "react";
import { API_BASE_URL } from "../../lib/api";

const ERROR_IMG_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false);

  const handleError = () => {
    setDidError(true);
  };

  const { src, alt, style, className, loading = "lazy", referrerPolicy = "no-referrer", fallbackSrc, ...rest } = props;

  // Construct proper image URL
  const getImageUrl = (imageSrc: string | Blob | undefined): string => {
    if (!imageSrc) return fallbackSrc || ERROR_IMG_SRC;
    
    // If it's a Blob, create object URL
    if (imageSrc instanceof Blob) {
      return URL.createObjectURL(imageSrc);
    }
    
    // If it's already a full URL (starts with http/https), use as is
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      return imageSrc;
    }
    
    // If it starts with 'uploads/', it's a local path - prepend API_BASE_URL
    if (imageSrc.startsWith('uploads/')) {
      return `${API_BASE_URL}/${imageSrc}`;
    }
    
    // If it's a relative path starting with '/', prepend API_BASE_URL
    // But avoid double-prefixing if it already starts with API_BASE_URL
    if (imageSrc.startsWith('/')) {
      if (API_BASE_URL && imageSrc.startsWith(API_BASE_URL)) {
        return imageSrc;
      }
      return `${API_BASE_URL}${imageSrc}`;
    }
    
    // Otherwise, treat as relative path and prepend API_BASE_URL with '/'
    return `${API_BASE_URL}/${imageSrc}`;
  };

  const imageUrl = getImageUrl(src);

  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${
        className || ""
      }`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img
          src={fallbackSrc || ERROR_IMG_SRC}
          alt="Error loading image"
          {...rest}
          data-original-url={src}
        />
      </div>
    </div>
  ) : (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
      loading={loading}
      referrerPolicy={referrerPolicy}
      {...rest}
      onError={handleError}
    />
  );
}
