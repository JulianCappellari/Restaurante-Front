import React from "react";
import { cn } from "@/lib/utils"; // Usa tu función 'cn' si la tienes, si no, elimina este helper

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}


