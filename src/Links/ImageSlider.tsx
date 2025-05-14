import { allIcons } from "@biqpod/app/ui/apis";
import { EmptyComponent, CircleTip, Icon } from "@biqpod/app/ui/components";
import React, { useState, useEffect, useRef } from "react";
interface SliderProps {
  photos?: string[];
  autoSlide?: boolean;
  slideInterval?: number;
}
export const ImageSlider: React.FC<SliderProps> = ({
  photos = [],
  autoSlide = false,
  slideInterval = 5000,
}) => {
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [animation, setAnimation] = useState(true);
  const sliderRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<number | null>(null);
  const nextSlide = () => {
    setAnimation(true);
    setCurrent((prev) => (prev + 1) % photos.length);
  };
  const prevSlide = () => {
    setAnimation(true);
    setCurrent((prev) => (prev - 1 + photos.length) % photos.length);
  };
  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setTranslateX(0);
    setAnimation(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    setTranslateX(deltaX);
  };
  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const sensitivity = 0.3;
    if (Math.abs(translateX) > window.innerWidth * sensitivity) {
      if (translateX > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    } else {
      setTranslateX(0);
      setAnimation(true);
    }
    setTranslateX(0);
  };
  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };
  useEffect(() => {
    const trackRef = sliderRef.current;
    if (trackRef) {
      trackRef.addEventListener("mousedown", handleMouseDown);
      trackRef.addEventListener("mousemove", handleMouseMove);
      trackRef.addEventListener("mouseup", handleMouseUp);
      trackRef.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        trackRef.removeEventListener("mousedown", handleMouseDown);
        trackRef.removeEventListener("mousemove", handleMouseMove);
        trackRef.removeEventListener("mouseup", handleMouseUp);
        trackRef.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, [isDragging, startX, translateX]);
  useEffect(() => {
    if (autoSlide) {
      intervalRef.current = window.setInterval(nextSlide, slideInterval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoSlide, slideInterval, photos.length]);
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
    transform: `translateX(calc(${-current * 100}% + ${translateX}px))`,
    transition: animation ? "transform 0.5s ease-in-out" : "none",
    display: "flex",
  };
  return (
    <div
      className="relative flex justify-center items-center w-full h-full overflow-hidden cursor-pointer"
      style={{ touchAction: "pan-y" }}
    >
      <div ref={sliderRef} className="flex w-full h-full" style={slideStyle}>
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative flex flex-shrink-0 justify-center items-center w-full h-full overflow-hidden cursor-pointer"
          >
            <img
              draggable="false"
              src={photo}
              className="absolute inset-0 opacity-40 blur-lg object-cover"
            />
            <div className="z-[10] flex justify-center w-full h-full">
              <img draggable="false" src={photo} className="h-full" />
            </div>
          </div>
        ))}
      </div>
      {photos.length > 1 && (
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
          <div className="bottom-2 left-1/2 absolute text-black -translate-x-1/2 transform">
            {current + 1} / {photos.length}
          </div>
        </EmptyComponent>
      )}
      {photos.length == 0 && (
        <Icon
          iconClassName="text-8xl text-[--biqpod-gray-opacity]"
          icon={allIcons.solid.faBoxOpen}
        />
      )}
    </div>
  );
};
