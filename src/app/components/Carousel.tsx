"use client";

import * as React from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const images = [
  "/images/slide1.jpg",
  "/images/slide2.jpg",
  "/images/slide3.jpg",
];

export function HeroCarousel() {
  return (
    <Carousel className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden">
      <CarouselContent>
        {images.map((src, index) => (
          <CarouselItem key={index}>
            <img src={src} alt={`Slide ${index + 1}`} className="w-full h-64 object-cover" />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
