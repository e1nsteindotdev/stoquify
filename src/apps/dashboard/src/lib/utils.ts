import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumberInput(value: string) {
  if (value === "") return "";
  const num = Number(value);
  if (isNaN(num)) return value;
  return num.toString();
}
