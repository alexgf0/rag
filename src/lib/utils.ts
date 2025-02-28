import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function splitStringByLength(str: string, length: number): string[] {
  return str.match(new RegExp(`.{1,${length}}`, 'g')) || [];
}

export function normalizeSpaces(str: string): string {
  return str.replace(/\s+/g, ' ');
}