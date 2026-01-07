import { useState } from 'react'
import { generatePalette, type ColorType } from './lib/colorPalette'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

/**
 * OKHsl Palette Generator
 *
 * Generates 10-step color palettes using the OKHsl color space developed by Björn Ottosson.
 * OKHsl provides better perceptual uniformity than standard HSL.
 *
 * Palette generation based on: "How to generate color palettes for design systems"
 * by Matt Ström-Awn (https://mattstromawn.com/writing/generating-color-palettes/)
 *
 * OKHsl color space: "Okhsv and Okhsl - Two new color spaces for color picking"
 * by Björn Ottosson (https://bottosson.github.io/posts/colorpicker/)
 *
 * Color conversions provided by the culori library (https://culorijs.org/)
 */

function App() {
  const [hue, setHue] = useState(180)
  const [colorType, setColorType] = useState<ColorType>('color')

  const palette = generatePalette(hue, colorType)

  return (
    <div className="h-screen w-full bg-background text-foreground flex flex-col border border-blue-400">
      <div className="p-4 border-b border-border">
        <p className="font-semibold">Colors</p>
      </div>

      <div className="w-full flex-1 items-center justify-center space-y-8 p-4">
        <div>

        </div>
        {/* Color Palette */}
        <div className="space-y-4">
          <div className="flex justify-center flex-wrap">
            {palette.map((color) => (
              <div key={color.scale} className="flex flex-col items-center gap-2">
                <div
                  className="w-18 h-24"
                  style={{ backgroundColor: color.hex }}
                />
                <span className="text-xs text-muted-foreground font-mono">
                  {color.scale}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-6 w-full max-w-md mx-auto">
          {/* Hue Control */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Hue: {hue}°
            </label>
            <div className="flex gap-3 items-center">
              <Slider
                value={[hue]}
                onValueChange={(values) => setHue(values[0])}
                min={0}
                max={360}
                step={0.1}
                className="flex-1"
              />
              <input
                type="number"
                min={0}
                max={360}
                value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                className="w-20 px-3 py-2 bg-muted border border-border rounded-md text-sm"
              />
            </div>
          </div>

          {/* Color Type Select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium">Color Type</label>
            <Select value={colorType} onValueChange={setColorType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="color">Color</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>
      {/* Attribution */}
      <div className="w-full text-center p-4">
        <p className="text-sm text-muted-foreground">
          OKHsl color space by{' '}
          <a
            href="https://bottosson.github.io/posts/colorpicker/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline"
          >
            Björn Ottosson
          </a>
        </p>
      </div>
    </div>
  )
}

export default App
