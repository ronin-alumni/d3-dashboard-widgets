import { useRef, useEffect } from 'react'
import * as d3 from 'd3'

const chartConfig = {
  height: 400,
  width: 1200,
  margin: {
    headerMonths: 20,
    headerDays: 40,
  },
}
const MS_IN_ONE_DAY = 1000 * 60 * 60 * 24
const monthLabel = d3.utcFormat('%b %Y')

function daysShift(start: Date, daysDelta: number): Date {
  const d = new Date(start.getTime())
  d.setDate(d.getDate() + daysDelta)
  return d
}

/**
 * Modular components that are responsible for rendering portions of the visualization
 */
export interface D3ZonePainter {
  getHeight: () => number
  paintData: (
    container: d3.Selection<SVGGElement, null, any, any>,
    x: d3.ScaleTime<Date, number>,
  ) => void
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

    // Draw initial inteface elements
    const dayTicks = initialX.ticks(d3.timeDay)
    const dayWidth = initialX(dayTicks[1]) - initialX(dayTicks[0])
    svg
      .select('#grid')
      .selectAll<SVGLineElement, Date>('line')
      .data(dayTicks, d => d.getTime())
      .join('line')
      .attr('transform', d => `translate(${Math.floor(initialX(d))},0)`)
      .attr('style', 'stroke: #CCC; stroke-width: 1px')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', chartConfig.margin.headerMonths + 5)
      .attr('y2', chartConfig.height)
    svg
      .select('#axis')
      .selectAll<SVGGElement, Date>('g.day')
      .data(dayTicks, d => d.getTime())
      .join('g')
      .attr('class', 'day')
      .attr('transform', d => `translate(${Math.floor(initialX(d))},0)`)
      .append('text')
      .attr('x', dayWidth / 2)
      .attr('text-anchor', 'middle')
      .attr('y', chartConfig.margin.headerDays)
      .text(d => d.getDate())

    const monthTicks = initialX.ticks(d3.timeMonth)
    svg
      .select('#axis')
      .selectAll<SVGGElement, Date>('g.month')
      .data(monthTicks, d => d.getTime())
      .join('g')
      .attr('class', 'month')
      .attr('transform', d => `translate(${Math.floor(initialX(d))},0)`)
      .call(g => {
        g.append('line')
          .attr('style', 'stroke: #AAA; stroke-width: 2px')
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', 0)
          .attr('y2', chartConfig.height)
        g.append('text')
          .attr('x', 5)
          .attr('y', chartConfig.margin.headerMonths)
          .text(d => monthLabel(d))
      })

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
