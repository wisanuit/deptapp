import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "THB"): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function daysBetween(start: Date, end: Date): number {
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * ดึงวันที่ปัจจุบันตามเวลาประเทศไทย (GMT+7)
 * @returns Date object ที่เป็นวันที่ไทย (เวลา 00:00:00)
 */
export function getThailandToday(): Date {
  // สร้าง Date object ใหม่และแปลงเป็นเวลาไทย
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const thailandTime = new Date(utc + (7 * 60 * 60 * 1000)); // UTC+7
  
  // Reset เวลาเป็น 00:00:00
  thailandTime.setHours(0, 0, 0, 0);
  
  return thailandTime;
}

/**
 * ดึงวันที่และเวลาปัจจุบันตามเวลาประเทศไทย (GMT+7)
 * @returns Date object ที่เป็นเวลาไทย
 */
export function getThailandNow(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (7 * 60 * 60 * 1000)); // UTC+7
}

/**
 * แปลงวันที่เป็น string format YYYY-MM-DD ตามเวลาไทย
 * @param date - Date object
 * @returns string format YYYY-MM-DD
 */
export function toThailandDateString(date?: Date): string {
  const d = date || getThailandToday();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
