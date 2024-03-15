import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

const chartConfig = {
  height: 400,
  width: 1200,
}
const MS_IN_ONE_DAY = 1000 * 60 * 60 * 24

function daysShift(start: Date, daysDelta: number): Date {
  const d = new Date(start.getTime())
  d.setDate(d.getDate() + daysDelta)
  return d
}

export default function GantTimeline() {
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Create D3 scale for initial state of the visualization
  const today = new Date(new Date().setUTCHours(0, 0, 0))
  const initialX = d3
    .scaleUtc()
    .domain([daysShift(today, -30), daysShift(today, 5)])
    .range([0, chartConfig.width])

  /**
   * On first render, setup visualization.
   *
   * 1. Determine size of overall visualization canvas (from the DOM element's rendered size)
   * 2. Set extents of initial scale(s)
   * 3. Paint axis and other elements used by all zones
   * 4. Tell each zone painter to paint initial data
   * 5. Set up mouse listeners for user interaction
   */
  async function initializeDashboard() {
    const svg = d3.select<SVGSVGElement, any>(svgRef.current!)
    chartConfig.height = svg.node()!.clientHeight
    chartConfig.width = svg.node()!.clientWidth
    initialX.range([0, chartConfig.width])

    // Draw initial axis
    const dayTicks = initialX.ticks(d3.timeDay)
    svg
      .select('#grid')
      .selectAll<SVGLineElement, Date>('line')
      .data(dayTicks, d => d.getTime())
      .join('line')
      .attr('style', 'stroke: #CCC; stroke-width: 1px')
      .attr('transform', d => `translate(${Math.floor(initialX(d))},0)`)
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', 0)
      .attr('y2', chartConfig.height)

    // Draw initial data into zones
  }

  useEffect(() => {
    if (svgRef.current == null) return
    initializeDashboard()
  }, [svgRef.current])

  return (
    <svg ref={svgRef} style={{ width: '100%', height: '400px', background: '#FFC' }}>
      <g id="grid" />
      <g id="data" />
      <g id="axis" />
    </svg>
  )
}
