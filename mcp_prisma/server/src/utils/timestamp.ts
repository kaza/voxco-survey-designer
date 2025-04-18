/**
 * Gets the current time formatted as MM:SS.
 * @returns The formatted timestamp string (e.g., "[14:32]").
 */
export function getTimestamp(): string {
  const now = new Date();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `[${minutes}:${seconds}]`;
} 