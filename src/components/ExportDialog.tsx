import { useState } from 'react'
import { type PaletteColor } from '@/lib/colorPalette'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { generateCssVariables, type ColorFormat } from '@/lib/exportUtils'

interface ExportDialogProps {
  palette: PaletteColor[]
  trigger: React.ReactNode
}

export function ExportDialog({ palette, trigger }: ExportDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('color')
  const [format, setFormat] = useState<ColorFormat>('oklch')
  const [useFunctionWrapper, setUseFunctionWrapper] = useState(true)
  const [copied, setCopied] = useState(false)

  const generatedCode = generateCssVariables(palette, name, format, useFunctionWrapper)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Export CSS Variables</DialogTitle>
          <DialogDescription>
            Configured for Tailwind 4
          </DialogDescription>
        </DialogHeader>

        {/* Input Fields */}
        <div className='space-y-4'>
          {/* Name Input */}
          <div className='space-y-2'>
            <label htmlFor='name' className='text-sm font-medium'>
              Variable Name
            </label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='w-full px-3 py-2 bg-muted border border-border rounded-md text-sm'
              placeholder='color'
            />
          </div>

          {/* Format Select */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Color Format</label>
            <Select value={format} onValueChange={(value) => setFormat(value as ColorFormat)}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='oklch'>OKLCH</SelectItem>
                <SelectItem value='hsl'>HSL</SelectItem>
                <SelectItem value='hex'>Hex</SelectItem>
                <SelectItem value='rgb'>RGB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Function Wrapper Toggle */}
          <div className='flex items-center justify-between'>
            <label htmlFor='functionWrapper' className='text-sm font-medium'>
              Function wrapper
            </label>
            <Switch
              id='functionWrapper'
              checked={useFunctionWrapper}
              onCheckedChange={setUseFunctionWrapper}
            />
          </div>

          {/* Preview */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Preview</label>
            <pre className='p-4 bg-muted border border-border rounded-md text-xs font-mono overflow-auto max-h-[300px]'>
              {generatedCode}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleCopy} className='w-full'>
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
