import { okhsl, formatHex } from 'culori'

/**
 * Color Palette Generator using OKHsl color space
 *
 * Based on "In practice: Crafting colors with functions" from:
 * "How to generate color palettes for design systems" by Matt Ström-Awn
 * https://mattstromawn.com/writing/generating-color-palettes/
 */

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
 * For colors: Returns H_base + 5 * (1 - n) to account for Bezold–Brücke shift
 *
 * @param baseHue - Base hue value (0-360)
 * @param n - Normalized scale value (0-1)
 * @param isNeutral - Whether this is a neutral color
 */
function calculateHue(baseHue: number, n: number, isNeutral: boolean): number {
  if (isNeutral) {
    return baseHue
  }
  return baseHue + 5 * (1 - n)
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
 * Calculate lightness for a given scale value
 *
 * L(n) = 1 - n
 * Scale 0 (n=0) → lightness 1 (white/lightest)
 * Scale 100 (n=1) → lightness 0 (black/darkest)
 *
 * @param n - Normalized scale value (0-1)
 */
function calculateLightness(n: number): number {
  return 1 - n
}

/**
 * Generate a 10-step color palette based on a base hue and color type
 *
 * Creates colors at scale numbers: 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95
 *
 * @param baseHue - Base hue value (0-360)
 * @param colorType - Whether to generate a 'neutral' or 'color' palette
 * @returns Array of 11 PaletteColor objects
 */
export function generatePalette(baseHue: number, colorType: ColorType): PaletteColor[] {
  const scales = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95]
  const isNeutral = colorType === 'neutral'

  return scales.map(scale => {
    // Normalize scale to 0-1 range
    const n = scale / 100

    // Calculate OKHsl values using the formulas
    const h = calculateHue(baseHue, n, isNeutral)
    const s = calculateSaturation(n, isNeutral)
    const l = calculateLightness(n)

    // Create OKHsl color object
    const okhslColor = okhsl({ h, s, l })

    // Convert to hex for display
    const hex = formatHex(okhslColor) || '#000000'

    return {
      scale,
      okhsl: { h, s, l },
      hex
    }
  })
}
