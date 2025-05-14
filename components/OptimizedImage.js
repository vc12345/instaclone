"use client";
import Image from "next/image";
import { useState } from "react";

export default function OptimizedImage({
  src,
  alt,
  fill = false,
  sizes = "100vw",
  className = "",
  priority = false,
  quality = 75,
  ...props
}) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Image
      src={src}
      alt={alt || ""}
      fill={fill}
      sizes={sizes}
      quality={quality}
      priority={priority}
      className={`${className} ${isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-500"}`}
      onLoadingComplete={() => setIsLoading(false)}
      {...props}
    />
  );
}