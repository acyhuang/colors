import { useState } from 'react'
import { generatePalette, type ColorType } from './lib/colorPalette'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const [colorType, setColorType] = useState<ColorType>('color')
  const [hueShift, setHueShift] = useState(5)

  const palette = generatePalette(hue, colorType, hueShift)

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
        <div className='w-full max-w-lg gap-2 space-y-6 border border-red-100'>

          {/* Hue Control */}
          <div className='space-y-2 flex-1'>
            <label className='block text-sm font-medium'>
              Base Hue: {hue}
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
                value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                className='w-20 px-3 py-2 bg-muted border border-border rounded-md text-sm'
              />
            </div>
          </div>

          {/* Hue Shift Control */}
          <div className='space-y-2 flex-1'>
            <label className='block text-sm font-medium'>
              Hue Shift (0 for neutrals)
            </label>
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

          {/* Color Type Select */}
          <div className='space-y-2'>
            <label className='block text-sm font-medium'>Color Type</label>
            <Select value={colorType} onValueChange={(value) => setColorType(value as ColorType)}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='color'>Color</SelectItem>
                <SelectItem value='neutral'>Neutral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Background Color */}  
          <div>
                
          </div>
        </div>


        {/* Display */}
        <div className='w-full max-w-lg space-y-8 border border-blue-100'>

          {/* Color Palette */}
          <div className='w-full'>
            <div className='flex w-full'>
              {palette.map((color) => (
                <div
                  key={color.scale}
                  className='flex flex-col items-center gap-2'
                  style={{ flex: '1 1 0' }}
                >
                  <div
                    className='h-16'
                    style={{
                      backgroundColor: color.hex,
                      width: '100%',
                    }}
                  />
                  <span className='text-xs text-muted-foreground font-mono'>
                    {color.scale}
                  </span>
                </div>
              ))}
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
          , generation from{' '}
          <a
            href=''
            target='_blank'
            rel='noopener noreferrer'
            className='text-primary hover:text-primary/80 underline'
          >
            Matt Ström-Awn
          </a>
          , interface inspired by{' '}
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
