import type { PaletteColor } from '@/lib/colorPalette'

// Constants
const GRAPH_WIDTH = 1000
const GRAPH_HEIGHT = 200
const PADDING = 20

// Types
interface ColorDimensionGraphsProps {
  palette: PaletteColor[]
}

interface ChartDataPoint {
  scale: number
  hue: number
  saturation: number
  lightness: number
  hex: string
}

type Dimension = 'hue' | 'saturation' | 'lightness'

/**
 * Transform palette data to chart format
 */
function transformPaletteToChartData(palette: PaletteColor[]): ChartDataPoint[] {
  return palette.map((color) => ({
    scale: color.scale,
    hue: color.okhsl.h,
    saturation: color.okhsl.s * 100,
    lightness: color.okhsl.l * 100,
    hex: color.hex,
  }))
}

/**
 * Get X position for a column index (center of column)
 */
function getXPosition(index: number, width: number, numColumns: number): number {
  const columnWidth = width / numColumns
  return columnWidth * index + columnWidth / 2
}

/**
 * Convert data value to SVG Y position
 */
function getYPosition(
  value: number,
  domain: [number, number],
  height: number,
  padding: number
): number {
  const [min, max] = domain
  const normalized = (value - min) / (max - min)
  // Invert Y (SVG grows downward)
  return height - (normalized * (height - 2 * padding)) - padding
}

interface GraphSVGProps {
  chartData: ChartDataPoint[]
  palette: PaletteColor[]
  dimension: Dimension
  domain: [number, number]
}

function GraphSVG({ chartData, palette, dimension, domain }: GraphSVGProps) {
  const WIDTH = GRAPH_WIDTH
  const HEIGHT = GRAPH_HEIGHT

  // Calculate point positions
  const points = chartData.map((point, idx) => ({
    x: getXPosition(idx, WIDTH, chartData.length),
    y: getYPosition(point[dimension], domain, HEIGHT, PADDING),
    hex: point.hex,
    value: point[dimension],
  }))

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
    >
      <defs>
        {/* Define gradients for line segments */}
        {palette.slice(0, -1).map((color, idx) => (
          <linearGradient
            key={`grad-${dimension}-${idx}`}
            id={`grad-${dimension}-${idx}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor={color.hex} />
            <stop offset="100%" stopColor={palette[idx + 1].hex} />
          </linearGradient>
        ))}
      </defs>

      {/* Line segments with gradients */}
      {points.slice(0, -1).map((point, idx) => {
        const nextPoint = points[idx + 1]
        return (
          <line
            key={`line-${idx}`}
            x1={point.x}
            y1={point.y}
            x2={nextPoint.x}
            y2={nextPoint.y}
            stroke={`url(#grad-${dimension}-${idx})`}
            strokeWidth={4}
          />
        )
      })}

      {/* Dots */}
      {points.map((point, idx) => (
        <circle
          key={`dot-${idx}`}
          cx={point.x}
          cy={point.y}
          r={6}
          fill={point.hex}
          stroke="#fff"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  )
}

interface GraphProps {
  title: string
  dimension: Dimension
  palette: PaletteColor[]
  chartData: ChartDataPoint[]
  domain: [number, number]
}

function Graph({
  title,
  dimension,
  palette,
  chartData,
  domain,
}: GraphProps) {
  return (
    <div className="bg-card">
      {/* Title */}
      <h3 className="text-sm font-medium mb-2">{title}</h3>

      <div className="border border-border">
        {/* Color Bar */}
        <div className="flex w-full mb-1">
          {palette.map((color, idx) => (
            <div
              key={idx}
              style={{
                flex: '1 1 0',
                backgroundColor: color.hex,
                height: '4px',
              }}
            />
          ))}
        </div>

        {/* Value Labels */}
        <div className="flex w-full mb-2">
          {chartData.map((point, idx) => (
            <div
              key={idx}
              style={{
                flex: '1 1 0',
                textAlign: 'center',
              }}
              className="text-xs text-muted-foreground"
            >
              {point[dimension].toFixed(1)}
            </div>
          ))}
        </div>

        {/* Graph */}
        <GraphSVG
          chartData={chartData}
          palette={palette}
          dimension={dimension}
          domain={domain}
        />
      </div>
    </div>
    
  )
}

export function ColorDimensionGraphs({ palette }: ColorDimensionGraphsProps) {
  const chartData = transformPaletteToChartData(palette)

  return (
    <div className="space-y-6">
      {/* Hue Graph */}
      <Graph
        title="Hue"
        dimension="hue"
        palette={palette}
        chartData={chartData}
        domain={[0, 360]}
      />

      {/* Saturation Graph */}
      <Graph
        title="Saturation"
        dimension="saturation"
        palette={palette}
        chartData={chartData}
        domain={[0, 100]}
      />

      {/* Lightness Graph */}
      <Graph
        title="Lightness"
        dimension="lightness"
        palette={palette}
        chartData={chartData}
        domain={[0, 100]}
      />
    </div>
  )
}
