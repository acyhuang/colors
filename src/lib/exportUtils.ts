import { type PaletteColor } from './colorPalette'
import { oklch, hsl, rgb } from 'culori'

export type ColorFormat = 'hex' | 'oklch' | 'hsl' | 'rgb'

/**
 * Round a number to specified decimal places
 */
function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}

/**
 * Generate CSS custom property declarations from a color palette
 *
 * @param palette - Array of PaletteColor objects
 * @param name - Variable name prefix (e.g., 'color' generates '--color-50')
 * @param format - Output color format
 * @returns Multi-line string of CSS variable declarations
 *
 * @example
 * generateCssVariables(palette, 'primary', 'hex')
 * // Returns:
 * // --primary-50: #f5fffe;
 * // --primary-100: #ebfdfc;
 * // ...
 */
export function generateCssVariables(
  palette: PaletteColor[],
  name: string,
  format: ColorFormat,
  useFunctionWrapper: boolean = true
): string {
  return palette
    .map((color) => {
      const value = formatColorValue(color, format, useFunctionWrapper)
      return `--${name}-${color.scale}0: ${value};`
    })
    .join('\n')
}

/**
 * Format a single color value based on the specified format
 *
 * @param color - PaletteColor object with okhsl and hex properties
 * @param format - Desired output format
 * @param useFunctionWrapper - Whether to wrap values in CSS functions
 * @returns Formatted color string
 */
function formatColorValue(
  color: PaletteColor,
  format: ColorFormat,
  useFunctionWrapper: boolean = true
): string {
  const { okhsl: okhslValue, hex } = color

  switch (format) {
    case 'hex': {
      return hex
    }

    case 'oklch': {
      // Convert okhsl to oklch
      const oklchColor = oklch({ ...okhslValue, mode: 'okhsl' })
      if (!oklchColor) return hex
      const l = round(oklchColor.l, 2)
      const c = round(oklchColor.c ?? 0, 2)
      const h = round(oklchColor.h ?? 0, 0)
      const values = `${l} ${c} ${h}`
      return useFunctionWrapper ? `oklch(${values})` : values
    }

    case 'hsl': {
      // Convert okhsl to standard hsl
      const hslColor = hsl({ ...okhslValue, mode: 'okhsl' })
      if (!hslColor) return hex
      const h = round(hslColor.h ?? 0, 1)
      const s = round((hslColor.s ?? 0) * 100, 1)
      const l = round((hslColor.l ?? 0) * 100, 1)
      const values = `${h} ${s}% ${l}%`
      return useFunctionWrapper ? `hsl(${values})` : values
    }

    case 'rgb': {
      // Convert okhsl to rgb
      const rgbColor = rgb({ ...okhslValue, mode: 'okhsl' })
      if (!rgbColor) return hex
      const r = Math.round((rgbColor.r ?? 0) * 255)
      const g = Math.round((rgbColor.g ?? 0) * 255)
      const b = Math.round((rgbColor.b ?? 0) * 255)
      const values = `${r} ${g} ${b}`
      return useFunctionWrapper ? `rgb(${values})` : values
    }

    default:
      return hex
  }
}
