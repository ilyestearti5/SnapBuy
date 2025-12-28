import { allIcons } from "@biqpod/app/ui/apis";
import { EmptyComponent, CircleTip, Line } from "@biqpod/app/ui/components";
import { useCopyState } from "@biqpod/app/ui/hooks";
import { Biqpod } from "@biqpod/app/ui/types";
import { tw } from "@biqpod/app/ui/utils";
import { useEffect, useRef } from "react";
import { MediaPreview } from "./NewProduct/Views/MediaPreview";
import { MediaShowContentPreview } from "./NewProduct/Views/MediaShowContentPreview";
interface SliderProps {
  files?: Biqpod.Snapbuy.Basic.File[];
  autoSlide?: boolean;
  slideInterval?: number;
  zoom?: boolean;
  viewImages?: boolean;
  viewContent?: boolean;
}
export const FilesSlider: React.FC<SliderProps> = ({
  files = [],
  autoSlide = false,
  slideInterval = 5000,
  zoom = false,
  viewImages = false,
  viewContent = false,
}) => {
  const current = useCopyState(0);
  const isDragging = useCopyState(false);
  const startX = useCopyState(0);
  const translateX = useCopyState(0);
  const animation = useCopyState(true);
  const zoomLevel = useCopyState(1);
  const zoomOrigin = useCopyState({ x: 50, y: 50 });
  const isZooming = useCopyState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const nextSlide = () => {
    animation.set(true);
    current.set((prev) => {
      if (prev + 1 < files.length) {
        return prev + 1;
      }
      return prev; // Stay on the last slide
    });
  };
  const prevSlide = () => {
    animation.set(true);
    current.set((prev) => {
      if (prev - 1 >= 0) {
        return prev - 1;
      }
      return prev; // Stay on the first slide
    });
  };
  const goToSlide = (index: number) => {
    animation.set(true);
    current.set(index);
  };
  const handleMouseDown = (e: MouseEvent) => {
    isDragging.set(true);
    startX.set(e.clientX);
    translateX.set(0);
    animation.set(false);
    // Disable zoom when dragging starts
    isZooming.set(false);
    zoomLevel.set(1);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.get) {
      // Prioritize dragging over zoom
      const deltaX = e.clientX - startX.get;
      translateX.set(deltaX);
      return;
    }
    if (zoom && !isDragging.get) {
      // Handle zoom functionality only when not dragging
      const rect = sliderRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate position relative to the current visible image, not the entire slider
        const currentImageOffset = current.get * rect.width;
        const adjustedX = e.clientX - rect.left + currentImageOffset;
        const x = ((adjustedX % rect.width) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        zoomOrigin.set({ x, y });
        isZooming.set(true);
        zoomLevel.set(2);
      }
      return;
    }
  };
  const handleMouseUp = () => {
    if (!isDragging.get) return;
    isDragging.set(false);
    const sensitivity = 0.3;
    if (Math.abs(translateX.get) > window.innerWidth * sensitivity) {
      if (translateX.get > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    } else {
      translateX.set(0);
      animation.set(true);
    }
    translateX.set(0);
  };
  const handleMouseLeave = () => {
    if (isDragging.get) {
      handleMouseUp();
    }
    if (zoom && isZooming.get) {
      isZooming.set(false);
      zoomLevel.set(1);
    }
  };
  const handleTouchStart = (e: TouchEvent) => {
    isDragging.set(true);
    startX.set(e.touches[0].clientX);
    translateX.set(0);
    animation.set(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.get) return;
    const deltaX = e.touches[0].clientX - startX.get;
    translateX.set(deltaX);
  };
  const handleTouchEnd = () => {
    if (!isDragging.get) return;
    isDragging.set(false);
    const sensitivity = 0.3;
    if (Math.abs(translateX.get) > window.innerWidth * sensitivity) {
      if (translateX.get > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    } else {
      translateX.set(0);
      animation.set(true);
    }
    translateX.set(0);
  };
  const handleTouchCancel = () => {
    if (isDragging.get) {
      handleTouchEnd();
    }
  };
  useEffect(() => {
    if (viewContent || (files.length < 2 && !zoom)) return;
    const trackRef = sliderRef.current;
    if (trackRef) {
      trackRef.addEventListener("mousedown", handleMouseDown);
      trackRef.addEventListener("mousemove", handleMouseMove);
      trackRef.addEventListener("mouseup", handleMouseUp);
      trackRef.addEventListener("mouseleave", handleMouseLeave);
      // Touch events for mobile (only when not zooming)
      if (!zoom) {
        trackRef.addEventListener("touchstart", handleTouchStart);
        trackRef.addEventListener("touchmove", handleTouchMove);
        trackRef.addEventListener("touchend", handleTouchEnd);
        trackRef.addEventListener("touchcancel", handleTouchCancel);
      }
      return () => {
        trackRef.removeEventListener("mousedown", handleMouseDown);
        trackRef.removeEventListener("mousemove", handleMouseMove);
        trackRef.removeEventListener("mouseup", handleMouseUp);
        trackRef.removeEventListener("mouseleave", handleMouseLeave);
        // Remove touch events
        if (!zoom) {
          trackRef.removeEventListener("touchstart", handleTouchStart);
          trackRef.removeEventListener("touchmove", handleTouchMove);
          trackRef.removeEventListener("touchend", handleTouchEnd);
          trackRef.removeEventListener("touchcancel", handleTouchCancel);
        }
      };
    }
  }, [
    isDragging.get,
    startX.get,
    translateX.get,
    zoom,
    isZooming.get,
    viewContent,
  ]);
  useEffect(() => {
    if (autoSlide) {
      intervalRef.current = window.setInterval(nextSlide, slideInterval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoSlide, slideInterval, files.length]);
  useEffect(() => {
    if (intervalRef.current && !autoSlide) {
      clearInterval(intervalRef.current);
    } else if (autoSlide) {
      intervalRef.current = window.setInterval(nextSlide, slideInterval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoSlide, slideInterval]);
  const slideStyle = {
    transform: `translateX(calc(${-current.get * 100}% + ${translateX.get}px))`,
    transition: animation.get ? "transform 0.5s ease-in-out" : "none",
    display: "flex",
  };
  return (
    <div className="flex flex-col w-full h-full">
      <div
        className={tw(
          "relative flex justify-center items-center w-full h-full overflow-hidden",
          zoom ? "cursor-zoom-in" : "cursor-pointer"
        )}
        style={{ touchAction: zoom ? "none" : "pan-y" }}
      >
        <div
          ref={sliderRef}
          className="flex items-center w-full h-full"
          style={slideStyle}
        >
          {files.map((file, index) => {
            return (
              <div
                key={index}
                className="flex flex-shrink-0 w-full h-full overflow-hidden cursor-pointer"
              >
                {!viewContent ? (
                  <MediaPreview mediaFile={file} />
                ) : (
                  <MediaShowContentPreview mediaFile={file} />
                )}
              </div>
            );
          })}
        </div>
        {files.length > 1 && !zoom && (
          <EmptyComponent>
            <div className="top-1/2 left-2 absolute -translate-y-1/2 transform">
              <CircleTip
                icon={allIcons.solid.faChevronLeft}
                onClick={prevSlide}
              />
            </div>
            <div className="top-1/2 right-2 absolute -translate-y-1/2 transform">
              <CircleTip
                icon={allIcons.solid.faChevronRight}
                onClick={nextSlide}
              />
            </div>
            {!viewImages && (
              <div className="bottom-2 left-1/2 absolute bg-[--biqpod-gray-opacity-2] px-2 rounded-lg text-white -translate-x-1/2 transform">
                {current.get + 1} / {files.length}
              </div>
            )}
          </EmptyComponent>
        )}
      </div>
      {viewImages && files.length > 1 && (
        <EmptyComponent>
          <Line />
          <div className="w-full">
            <div className="flex justify-center gap-2 p-2 w-full overflow-x-auto">
              {files.map((file, index) => (
                <div
                  key={index}
                  className={tw(
                    "flex-shrink-0 rounded-lg cursor-pointer transition-all duration-200 w-20 h-20 overflow-hidden",
                    current.get === index
                      ? "opacity-100"
                      : "opacity-60 hover:opacity-80"
                  )}
                  onClick={() => goToSlide(index)}
                >
                  <img
                    src={file.url}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </EmptyComponent>
      )}
    </div>
  );
};
