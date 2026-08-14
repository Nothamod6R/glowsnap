import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ShapeConfig } from "@/types/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cloneShape<T extends ShapeConfig>(shape: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(shape);
  }
  return JSON.parse(JSON.stringify(shape)) as T;
}
