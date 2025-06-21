"use client";

import debounce from "lodash.debounce";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";

interface SlidePreviewRendererProps {
  slideIndex: number;
  slideId: string;
  children: React.ReactNode;
}

export function SlidePreviewRenderer({
  slideIndex,
  children,
}: SlidePreviewRendererProps) {
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const childrenRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    editorWidth: 0,
    editorHeight: 0,
    previewWidth: 0,
    previewHeight: 0,
  });

  // Only render on client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const calculateDimensions = () => {
      const slidePreview = document.querySelector(
        `#slide-preview-${slideIndex}`
      );

      if (!slidePreview || !childrenRef.current) return;

      const previewRect = slidePreview.getBoundingClientRect();
      const editorRect = childrenRef.current.getBoundingClientRect();

      const previewWidth = previewRect.width;
      const previewHeight = previewRect.height;
      const editorWidth = editorRect.width;
      // For 16:9 aspect ratio, calculate height based on width
      const editorHeight = editorWidth * (9 / 16);
      
      // Calculate scale to fit the preview maintaining aspect ratio
      const scaleX = previewWidth / editorWidth;
      const scaleY = previewHeight / editorHeight;
      const newScale = Math.min(scaleX, scaleY);
      
      setDimensions({
        editorWidth,
        editorHeight,
        previewWidth,
        previewHeight,
      });

      setScale(newScale);
    };

    const debouncedCalculateDimensions = debounce(calculateDimensions, 600);

    // Setup resize observer for responsive scaling
    const observer = new ResizeObserver(() => {
      debouncedCalculateDimensions();
    });

    const slidePreview = document.querySelector(`#slide-preview-${slideIndex}`);
    if (slidePreview && childrenRef.current) {
      observer.observe(slidePreview);
      observer.observe(childrenRef.current);
      // Initial calculation
      calculateDimensions();
    }

    return () => {
      observer.disconnect();
    };
  }, [slideIndex, mounted]);

  if (!mounted) return null;

  // Find the preview element to portal into
  const previewElement = document.querySelector(`#slide-preview-${slideIndex}`);
  if (!previewElement) return null;

  // For 16:9 aspect ratio, calculate expected height
  const expectedHeight = dimensions.previewWidth * (9 / 16);

  return (
    <div
      ref={childrenRef}
      style={{ position: "absolute", visibility: "hidden" }}
    >
      {children}
      {createPortal(
        <div
          className="w-full"
          style={{
            height: expectedHeight && expectedHeight > 0 ? expectedHeight : "75px",
            aspectRatio: "16 / 9",
            transition: "height 150ms ease-in-out",
          }}
        >
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              width: dimensions.editorWidth || 0,
              height: dimensions.editorHeight || 0,
              pointerEvents: "none",
            }}
          >
            {children}
          </div>
        </div>,
        previewElement
      )}
    </div>
  );
}
