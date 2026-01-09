import { okhsl, formatHex, converter } from 'culori'

export const BACKGROUND_COLOR = '#FFFFFF'

// D65 white point chromaticity ratios for neutral gray in XYZ
const D65_X = 0.95047
const D65_Z = 1.08883

/**
 * Color Palette Generator using OKHsl color space
 *
 * Based on "In practice: Crafting colors with functions" from:
 * "How to generate color palettes for design systems" by Matt Ström-Awn
 * https://mattstromawn.com/writing/generating-color-palettes/
 */

/**
 * Convert HSL hue to OkHSL hue
 *
 * Uses mid-range saturation and lightness for stable conversion
 * @param hslHue - HSL hue value (0-360)
 * @returns OkHSL hue value (0-360)
 */
export function hslToOkhslHue(hslHue: number): number {
  const toOkhsl = converter('okhsl')
  const okhslColor = toOkhsl({
    mode: 'hsl',
    h: hslHue,
    s: 0.8,
    l: 0.5
  })
  return okhslColor?.h ?? hslHue
}

/**
 * Convert OkHSL hue to HSL hue
 *
 * Uses mid-range saturation and lightness for stable conversion
 * @param okhslHue - OkHSL hue value (0-360)
 * @returns HSL hue value (0-360)
 */
export function okhslToHslHue(okhslHue: number): number {
  const toHsl = converter('hsl')
  const hslColor = toHsl({
    mode: 'okhsl',
    h: okhslHue,
    s: 0.8,
    l: 0.5
  })
  return hslColor?.h ?? okhslHue
}

/**
 * Get XYZ Y (luminance) value from a hex color
 *
 * @param hexColor - Hex color string (e.g., '#FFFFFF')
 * @returns Luminance value (0-1), defaults to 1.0 (white) if conversion fails
 */
export function getColorLuminance(hexColor: string): number {
  const toXyz = converter('xyz65')
  const xyzColor = toXyz(hexColor)
  return xyzColor?.y ?? 1.0
}

/**
 * Calculate WCAG contrast ratio between two colors
 *
 * @param hex1 - First hex color
 * @param hex2 - Second hex color
 * @returns Contrast ratio (1 to 21)
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const L1 = getColorLuminance(hex1)
  const L2 = getColorLuminance(hex2)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Get appropriate text color (black or white) for overlay on a given background
 *
 * @param backgroundHex - Background color hex
 * @returns '#000000' or '#FFFFFF'
 */
export function getOverlayTextColor(backgroundHex: string): string {
  const luminance = getColorLuminance(backgroundHex)
  return luminance > 0.179 ? '#000000' : '#FFFFFF'
}

export interface PaletteColor {
  scale: number
  okhsl: { h: number; s: number; l: number }
  hex: string
}

/**
 * Calculate hue for a given scale value
 *
 * Returns H_base + hueShift * (1 - n) to account for Bezold–Brücke shift
 * When hueShift = 0, this returns a constant baseHue
 *
 * @param baseHue - Base hue value (0-360)
 * @param n - Normalized scale value (0-1)
 * @param hueShift - Amount of hue shift to apply
 */
function calculateHue(baseHue: number, n: number, hueShift: number): number {
  return baseHue + hueShift * (1 - n)
}

/**
 * Calculate saturation for a given scale value
 *
 * Uses parabolic curve S(n) = -4(Smax - Smin)n² + 4(Smax - Smin)n + Smin
 * Peaks at maxSaturation at n=0.5, and equals minSaturation at n=0 and n=1
 *
 * @param n - Normalized scale value (0-1)
 * @param maxSaturation - Maximum saturation value at n=0.5 (0-1 range)
 * @param minSaturation - Minimum saturation value at n=0 and n=1 (0-1 range)
 */
function calculateSaturation(n: number, maxSaturation: number, minSaturation: number): number {
  const amplitude = 4 * (maxSaturation - minSaturation)
  return -amplitude * Math.pow(n, 2) + amplitude * n + minSaturation
}

/**
 * Calculate lightness for a given scale value using contrast-aware method
 *
 * Based on "Making scales accessible" from Matt Ström-Awn's article.
 * Uses exponential contrast curve and WCAG contrast formulas to ensure
 * colors 500 steps apart have ≥4.5:1 contrast ratio.
 *
 * @param n - Normalized scale value (0-1)
 * @param backgroundY - XYZ Y (luminance) of background color (0-1)
 * @returns OKHsl lightness value (0-1)
 */
function calculateLightness(n: number, backgroundY: number): number {
  // Target contrast ratio using exponential curve: r(x) = e^(3.04x)
  const targetContrast = Math.exp(3.04 * n)

  // Check if background is light or dark (threshold: Y = 0.18)
  const isLightBackground = backgroundY > 0.18

  // Calculate required luminance using WCAG contrast formula
  let requiredY: number
  if (isLightBackground) {
    // For light backgrounds: Yf = (Yb + 0.05) / r - 0.05
    requiredY = (backgroundY + 0.05) / targetContrast - 0.05
  } else {
    // For dark backgrounds: Yf = r * (Yb + 0.05) - 0.05
    requiredY = targetContrast * (backgroundY + 0.05) - 0.05
  }

  // Clamp to valid range [0, 1]
  requiredY = Math.max(0, Math.min(1, requiredY))

  // Convert XYZ Y to OKHsl L using culori's proper conversion chain
  // Create a neutral gray in XYZ with the target luminance (D65 white point)
  const toOkhsl = converter('okhsl')
  const xyzGray = {
    mode: 'xyz65' as const,
    x: D65_X * requiredY,
    y: requiredY,
    z: D65_Z * requiredY
  }
  const okhslGray = toOkhsl(xyzGray)

  return okhslGray?.l ?? 0
}

/**
 * Generate a 10-step color palette based on a base hue
 *
 * Creates colors at scale numbers: 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95
 * Uses contrast-aware lightness calculation to ensure colors 500 steps apart
 * have ≥4.5:1 contrast ratio (WCAG AA level) on white backgrounds.
 *
 * @param baseHue - Base hue value (0-360)
 * @param hueShift - Amount of hue shift to apply (default: 5, use 0 for neutrals)
 * @param maxSaturation - Maximum saturation at n=0.5 (0-100, default: 100, use 20 for neutrals)
 * @param minSaturation - Minimum saturation at n=0 and n=1 (0-100, default: 0)
 * @returns Array of 11 PaletteColor objects
 */
export function generatePalette(baseHue: number, hueShift: number = 5, maxSaturation: number = 100, minSaturation: number = 0): PaletteColor[] {
  const scales = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95]

  const backgroundY = getColorLuminance(BACKGROUND_COLOR)

  return scales.map(scale => {
    // Normalize scale to 0-1 range
    const n = scale / 100

    // Convert saturation from percentage (0-100) to decimal (0-1)
    const maxSaturationDecimal = maxSaturation / 100
    const minSaturationDecimal = minSaturation / 100

    // Calculate OKHsl values using the formulas
    const h = calculateHue(baseHue, n, hueShift)
    const s = calculateSaturation(n, maxSaturationDecimal, minSaturationDecimal)
    const l = calculateLightness(n, backgroundY)

    // Create OKHsl color object
    const okhslColor = okhsl({ mode: 'okhsl', h, s, l })

    // Convert to hex for display
    const hex = formatHex(okhslColor) || '#000000'

    return {
      scale,
      okhsl: { h, s, l },
      hex
    }
  })
}
