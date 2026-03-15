/**
 * Utilities for extracting structured JSON from AI response text.
 * AI models often wrap JSON in markdown code fences or additional text;
 * these helpers robustly extract the JSON portion.
 */

/**
 * Extract the first JSON array from an AI response string.
 * Handles responses that contain surrounding text or markdown code fences.
 * @returns The parsed array, or null if no valid JSON array is found.
 */
export function parseJsonArray(response: string): unknown[] | null {
  const match = response.match(/\[[\s\S]*\]/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Extract the first JSON object from an AI response string.
 * Handles responses that contain surrounding text or markdown code fences.
 * @returns The parsed object, or null if no valid JSON object is found.
 */
export function parseJsonObject(response: string): Record<string, unknown> | null {
  const match = response.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[0])
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}
