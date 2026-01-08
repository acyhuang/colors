import { okhsl, formatHex, converter } from 'culori'

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
 * Calculate the saturation curve coefficient from desired maximum saturation
 *
 * Given S(n) = -a*n² + a*n, the maximum occurs at n=0.5 where S(0.5) = a*0.25
 * Therefore: a = 4 * maxSaturation
 *
 * @param maxSaturation - Maximum saturation value at n=0.5 (0-1 range)
 * @returns Coefficient 'a' for the parabolic curve
 */
function calculateSaturationCoefficient(maxSaturation: number): number {
  return 4 * maxSaturation
}

/**
 * Calculate saturation for a given scale value
 *
 * Uses a parabolic curve S(n) = -a*n² + a*n that peaks at n=0.5
 * The coefficient 'a' is derived from the desired maximum saturation
 *
 * @param n - Normalized scale value (0-1)
 * @param maxSaturation - Maximum saturation value at n=0.5 (0-1 range)
 */
function calculateSaturation(n: number, maxSaturation: number): number {
  const a = calculateSaturationCoefficient(maxSaturation)
  return -a * Math.pow(n, 2) + a * n
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
 * Generate a 10-step color palette based on a base hue
 *
 * Creates colors at scale numbers: 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95
 * Uses contrast-aware lightness calculation to ensure colors 500 steps apart
 * have ≥4.5:1 contrast ratio (WCAG AA level) on white backgrounds.
 *
 * @param baseHue - Base hue value (0-360)
 * @param hueShift - Amount of hue shift to apply (default: 5, use 0 for neutrals)
 * @param maxSaturation - Maximum saturation at n=0.5 (0-100, default: 100, use 20 for neutrals)
 * @returns Array of 11 PaletteColor objects
 */
export function generatePalette(baseHue: number, hueShift: number = 5, maxSaturation: number = 100): PaletteColor[] {
  const scales = [5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95]

  // Fixed white background for contrast calculations (user-configurable version coming later)
  const backgroundColor = '#FFFFFF'
  const backgroundY = getColorLuminance(backgroundColor)

  return scales.map(scale => {
    // Normalize scale to 0-1 range
    const n = scale / 100

    // Convert max saturation from percentage (0-100) to decimal (0-1)
    const maxSaturationDecimal = maxSaturation / 100

    // Calculate OKHsl values using the formulas
    const h = calculateHue(baseHue, n, hueShift)
    const s = calculateSaturation(n, maxSaturationDecimal)
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
