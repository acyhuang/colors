import { useState, useRef, useEffect } from 'react'
import { generatePalette, hslToOkhslHue, okhslToHslHue, calculateContrastRatio, getOverlayTextColor, BACKGROUND_COLOR } from './lib/colorPalette'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import { ColorDimensionGraphs } from '@/components/ColorDimensionGraphs'
import { Button } from './components/ui/button'
import { ExportDialog } from '@/components/ExportDialog'

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
  const [hslHue, setHslHue] = useState(210)
  const [hueShift, setHueShift] = useState(5)
  const [maxSaturation, setMaxSaturation] = useState(100)
  const [minSaturation, setMinSaturation] = useState(0)
  const [selectedScale, setSelectedScale] = useState<number | null>(null)

  // Refs to prevent infinite sync loops
  const isUpdatingFromHsl = useRef(false)
  const isUpdatingFromOkhsl = useRef(false)

  // Sync HSL → OkHSL
  useEffect(() => {
    if (isUpdatingFromOkhsl.current) {
      isUpdatingFromOkhsl.current = false
      return
    }

    isUpdatingFromHsl.current = true
    const convertedOkhslHue = hslToOkhslHue(hslHue)
    setHue(convertedOkhslHue)
  }, [hslHue])

  // Sync OkHSL → HSL
  useEffect(() => {
    if (isUpdatingFromHsl.current) {
      isUpdatingFromHsl.current = false
      return
    }

    isUpdatingFromOkhsl.current = true
    const convertedHslHue = okhslToHslHue(hue)
    setHslHue(convertedHslHue)
  }, [hue])

  const palette = generatePalette(hue, hueShift, maxSaturation, minSaturation)

  return (
    <div className='h-screen w-full bg-background text-foreground flex flex-col'>
      <div className='p-4 flex justify-between items-center border-b border-border'>
        <p>Colors</p>
        <ExportDialog
          palette={palette}
          trigger={
            <Button variant='outline' size='sm'>
              Export
            </Button>
          }
        />
      </div>

      <div className='w-full md:flex flex-1 gap-8 p-4'>
        
      {/* Inputs */}
        <div className='w-full max-w-lg md:max-w-md gap-2 space-y-6'>

          {/* HSL Hue Control */}
          <div className='space-y-2 flex-1'>
            <label className='block text-sm font-medium'>
              Base Hue (HSL)
            </label>
            <div className='flex gap-3 items-center'>
              <Slider
                value={[hslHue]}
                onValueChange={(values) => setHslHue(values[0])}
                min={0}
                max={360}
                step={0.1}
                className='flex-1'
              />
              <input
                type='number'
                min={0}
                max={360}
                value={hslHue.toFixed(1)}
                onChange={(e) => setHslHue(Number(e.target.value))}
                className='w-20 px-3 py-2 bg-muted border border-border rounded-md text-sm'
              />
            </div>
          </div>

          {/* OkHSL Hue Control */}
          <div className='space-y-2 flex-1'>
            <label className='block text-sm font-medium'>
              Base Hue (OkHSL)
            </label>
            <div className='flex gap-3 items-center'>
              <Slider
                value={[hue]}
                onValueChange={(values) => setHue(values[0])}
                min={0}
                max={360}
                step={0.1}
                className='flex-1'
              />
              <input
                type='number'
                min={0}
                max={360}
                value={hue.toFixed(1)}
                onChange={(e) => setHue(Number(e.target.value))}
                className='w-20 px-3 py-2 bg-muted border border-border rounded-md text-sm'
              />
            </div>
          </div>

          {/* Hue Shift Control */}
          <div className='space-y-2 flex-1'>
            <div className='flex items-baseline gap-2'>
              <label className='block text-sm font-medium'>Hue Shift</label>
              <p className='text-xs text-muted-foreground'>0 for neutrals</p>
            </div>
            <input
              type='number'
              min={0}
              max={20}
              step={0.5}
              value={hueShift}
              onChange={(e) => setHueShift(Number(e.target.value))}
              className='w-full px-3 py-2 bg-muted border border-border rounded-md text-sm'
            />
          </div>

          {/* Saturation Controls */}
          <div className='flex gap-4'>
            <div className='space-y-2 flex-1'>
              <label className='block text-sm font-medium'>Min Saturation</label>
              <input
                type='number'
                min={0}
                max={100}
                step={1}
                value={minSaturation}
                onChange={(e) => setMinSaturation(Number(e.target.value))}
                className='w-full px-3 py-2 bg-muted border border-border rounded-md text-sm'
              />
            </div>

            <div className='space-y-2 flex-1'>
              <div className='flex items-baseline gap-2'>
                <label className='block text-sm font-medium'>Max Saturation</label>
                <p className='text-xs text-muted-foreground'>20 for neutrals</p>
              </div>
              <input
                type='number'
                min={0}
                max={100}
                step={1}
                value={maxSaturation}
                onChange={(e) => setMaxSaturation(Number(e.target.value))}
                className='w-full px-3 py-2 bg-muted border border-border rounded-md text-sm'
              />
            </div>
          </div>


          {/* Background Color */}  
          <div>
                
          </div>
        </div>

        {/* Display */}
        <div className='w-full max-w-lg space-y-8 '>

          {/* Color Palette */}
          <div className='w-full'>
            <div className='flex w-full group'>
              {palette.map((color) => {
                const isSelected = selectedScale === color.scale
                const selectedColor = palette.find(c => c.scale === selectedScale)
                const hasSelection = selectedScale !== null
                const showOverlay = !isSelected
                const compareColor = selectedColor?.hex ?? BACKGROUND_COLOR
                const contrastRatio = showOverlay
                  ? calculateContrastRatio(compareColor, color.hex)
                  : null

                return (
                  <div
                    key={color.scale}
                    className='flex flex-col items-center gap-2'
                    style={{ flex: '1 1 0' }}
                  >
                    <div
                      className={cn(
                        'h-16 relative cursor-pointer transition-all',
                        isSelected && 'border-4 border-white'
                      )}
                      style={{
                        backgroundColor: color.hex,
                        width: '100%',
                      }}
                      onClick={() => setSelectedScale(prev => prev === color.scale ? null : color.scale)}
                    >
                      {showOverlay && contrastRatio !== null && (
                        <div
                          className={cn(
                            'absolute inset-0 flex items-center justify-center transition-opacity',
                            !hasSelection && 'opacity-0 group-hover:opacity-50'
                          )}
                          style={{
                            color: getOverlayTextColor(color.hex),
                            ...(hasSelection && { opacity: 0.5 })
                          }}
                        >
                          <span className='text-sm font-mono font-medium'>
                            {contrastRatio.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className='text-xs text-muted-foreground font-mono'>
                      {color.scale}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Color Dimension Graphs */}
          <ColorDimensionGraphs palette={palette} />
        {/* </div> */}
      </div>

      </div>
      {/* Attribution */}
      <div className='w-full text-center p-4'>
        <p className='text-xs text-muted-foreground'>
          OKHsl color space by{' '}
          <a
            href='https://bottosson.github.io/posts/colorpicker/'
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:text-primary/80 underline'
          >
            Björn Ottosson
          </a>
          ; generation from{' '}
          <a
            href=''
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:text-primary/80 underline'
          >
            Matt Ström-Awn
          </a>
          ; interface inspired by{' '}
          <a
            href='https://stripe.com/blog/accessible-color-systems'
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:text-primary/80 underline'
          >
            Daryl Koopersmith, Wilson Miner
          </a>
        </p>
      </div>
          
    </div>
  )
}

export default App
