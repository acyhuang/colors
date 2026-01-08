import { okhsl, formatHex, converter } from 'culori'

/**
 * Color Palette Generator using OKHsl color space
 *
 * Based on "In practice: Crafting colors with functions" from:
 * "How to generate color palettes for design systems" by Matt Ström-Awn
 * https://mattstromawn.com/writing/generating-color-palettes/
 */

/**
 * Convert XYZ Y (luminance) to LAB L* (lightness)
 *
 * Based on CIE LAB formula with piecewise function
 * @param Y - Luminance value (0-1)
 * @returns LAB L* value (0-100)
 */
function YtoL(Y: number): number {
  const threshold = 0.0088564516 // (6/29)^3
  if (Y <= threshold) {
    return Y * 903.2962962
  } else {
    return 116 * Math.pow(Y, 1 / 3) - 16
  }
}

/**
 * OKHsl toe function
 *
 * Maps LAB L* to OKHsl L using the toe function
 * @param l - LAB L* value normalized to 0-1 range
 * @returns OKHsl L value
 */
function toe(l: number): number {
  const k1 = 0.206
  const k2 = 0.03
  const k3 = (1 + k1) / (1 + k2)

  return 0.5 * (k3 * l - k1 + Math.sqrt((k3 * l - k1) * (k3 * l - k1) + 4 * k2 * k3 * l))
}

/**
 * Get XYZ Y (luminance) value from a hex color
 *
 * @param hexColor - Hex color string (e.g., '#FFFFFF')
 * @returns Luminance value (0-1), defaults to 1.0 (white) if conversion fails
 */
function getColorLuminance(hexColor: string): number {
  const toXyz = converter('xyz65')
  const xyzColor = toXyz(hexColor)
  return xyzColor?.y ?? 1.0
}

export type ColorType = 'neutral' | 'color'

export interface PaletteColor {
  scale: number
  okhsl: { h: number; s: number; l: number }
  hex: string
}

/**
 * Calculate hue for a given scale value
 *
 * For neutrals: Returns constant hue
 * For colors: Returns H_base + hueShift * (1 - n) to account for Bezold–Brücke shift
 *
 * @param baseHue - Base hue value (0-360)
 * @param n - Normalized scale value (0-1)
 * @param isNeutral - Whether this is a neutral color
 * @param hueShift - Amount of hue shift to apply
 */
function calculateHue(baseHue: number, n: number, isNeutral: boolean, hueShift: number): number {
  if (isNeutral) {
    return baseHue
  }
  return baseHue + hueShift * (1 - n)
}

/**
 * Calculate saturation for a given scale value
 *
 * For neutrals: S(n) = -0.8n² + 0.8n (peaks at 20% saturation)
 * For colors: S(n) = -4n² + 4n (peaks at 100% saturation)
 *
 * Both use a parabolic curve that peaks at n=0.5
 *
 * @param n - Normalized scale value (0-1)
 * @param isNeutral - Whether this is a neutral color
 */
function calculateSaturation(n: number, isNeutral: boolean): number {
  if (isNeutral) {
    // Max saturation of 0.2 (20%) for neutrals
    return -0.8 * Math.pow(n, 2) + 0.8 * n
  }
  // Max saturation of 1.0 (100%) for colors
  return -4 * Math.pow(n, 2) + 4 * n
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

  // Convert: XYZ Y → LAB L* → OKHsl L
  const labL = YtoL(requiredY)
  const okhslL = toe(labL / 100) // LAB L* is 0-100, normalize to 0-1

  return okhslL
}

/**
 * Generate a 10-step color palette based on a base hue and color type
 *
 * Creates colors at scale numbers: 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95
 * Uses contrast-aware lightness calculation to ensure colors 500 steps apart
 * have ≥4.5:1 contrast ratio (WCAG AA level) on white backgrounds.
 *
 * @param baseHue - Base hue value (0-360)
 * @param colorType - Whether to generate a 'neutral' or 'color' palette
 * @param hueShift - Amount of hue shift to apply (default: 5)
 * @returns Array of 11 PaletteColor objects
 */
export function generatePalette(baseHue: number, colorType: ColorType, hueShift: number = 5): PaletteColor[] {
  const scales = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95]
  const isNeutral = colorType === 'neutral'

  // Fixed white background for contrast calculations (user-configurable version coming later)
  const backgroundColor = '#FFFFFF'
  const backgroundY = getColorLuminance(backgroundColor)

  return scales.map(scale => {
    // Normalize scale to 0-1 range
    const n = scale / 100

    // Calculate OKHsl values using the formulas
    const h = calculateHue(baseHue, n, isNeutral, hueShift)
    const s = calculateSaturation(n, isNeutral)
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
