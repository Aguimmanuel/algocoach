import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge conditional class names, letting later Tailwind utilities win.
 *
 * This is shadcn/ui's canonical helper: `clsx` flattens the inputs, and
 * `tailwind-merge` resolves conflicts (`px-2 px-4` → `px-4`) so a component's
 * own classes can always be overridden by the caller.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
