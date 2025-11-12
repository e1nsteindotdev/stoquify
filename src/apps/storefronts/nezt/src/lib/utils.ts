import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function deepMapToObject<T>(value: T): any {
  if (value instanceof Map) {
    const obj: Record<string, any> = {};
    for (const [k, v] of value.entries()) {
      obj[String(k)] = deepMapToObject(v);
    }
    return obj;
  }

  if (Array.isArray(value)) {
    return value.map(item => deepMapToObject(item));
  }

  if (value !== null && typeof value === 'object') {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      obj[k] = deepMapToObject(v);
    }
    return obj;
  }

  return value;
}
