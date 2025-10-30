import { format } from "date-fns";
import { th } from "date-fns/locale";

/**
 * Format date to Thai Buddhist Era (พ.ศ.)
 * Example: "1 ส.ค. 2568" (instead of "1 ส.ค. 2025")
 */
export function formatThaiDate(date: Date | string, dateFormat: string = "d MMM yyyy"): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatted = format(dateObj, dateFormat, { locale: th });
  
  // Convert Christian Era (ค.ศ.) to Buddhist Era (พ.ศ.) by adding 543 years
  const year = dateObj.getFullYear();
  const buddhistYear = year + 543;
  
  return formatted.replace(year.toString(), buddhistYear.toString());
}

/**
 * Format date to short Thai format with Buddhist Era
 * Example: "1 ส.ค. 2568"
 */
export function formatThaiShortDate(date: Date | string): string {
  return formatThaiDate(date, "d MMM yyyy");
}

/**
 * Format date to long Thai format with Buddhist Era
 * Example: "1 สิงหาคม 2568"
 */
export function formatThaiLongDate(date: Date | string): string {
  return formatThaiDate(date, "d MMMM yyyy");
}

/**
 * Format datetime to Thai format with Buddhist Era
 * Example: "1 สิงหาคม 2568 14:30 น."
 */
export function formatThaiDateTime(date: Date | string): string {
  return formatThaiDate(date, "d MMMM yyyy HH:mm 'น.'");
}
