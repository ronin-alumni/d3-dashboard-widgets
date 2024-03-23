import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import styles from './GanttTimeline.module.css'

const chartConfig = {
  height: 400,
  width: 1200,
  margin: {
    headerMonths: 20,
    headerDays: 40,
    zone: 5,
  },
  padding: {
    zone: 10,
  },
}

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
  data: any[]
  title: string
  init: () => Promise<boolean>
  getHeight: () => number
  paintData: (
    container: d3.Selection<SVGGElement, null, any, any>,
    x: d3.ScaleTime<number, number>,
  ) => Promise<boolean>
}

export default function GantTimeline({ zones }: { zones: D3ZonePainter[] }) {
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

    // Paint initial inteface elements
    const dayTicks = initialX.ticks(d3.timeDay)
    const dayWidth = initialX(dayTicks[1]) - initialX(dayTicks[0])

    // Highlight today's column
    const today = new Date()
    today.setHours(0, 0, 0)
    svg
      .select('#grid')
      .append('rect')
      .attr('id', 'today')
      .attr('style', 'fill: #FFF; fill-opacity: 0.2')
      .attr('x', initialX(today))
      .attr('width', dayWidth)
      .attr('height', chartConfig.height)

    // Paint lines between each day
    svg
      .select('#grid')
      .selectAll<SVGLineElement, Date>('line')
      .data(dayTicks, d => d.getTime())
      .join('line')
      .attr('transform', d => `translate(${Math.floor(initialX(d))},0)`)
      .attr('style', d => `stroke: ${d.getDay() == 0 ? '#555' : '#CCC'}; stroke-width: 1px`) // Draw darker lines to start each week
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', chartConfig.margin.headerMonths + 5)
      .attr('y2', chartConfig.height)
    // Paint numbers for each calendar day
    svg
      .select('#axis')
      .selectAll<SVGGElement, Date>('g.day')
      .data(dayTicks, d => d.getTime())
      .join('g')
      .attr('class', 'day')
      .attr('transform', d => `translate(${Math.floor(initialX(d))},0)`)
      .append('text')
      .attr('class', styles.headerDays)
      .attr('x', dayWidth / 2)
      .attr('text-anchor', 'middle')
      .attr('y', chartConfig.margin.headerDays)
      .text(d => d.getDate())

    // Paint thicker lines and labels for each month
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
          .attr('style', 'stroke: #555; stroke-width: 2px')
          .attr('x1', 0)
          .attr('x2', 0)
          .attr('y1', 0)
          .attr('y2', chartConfig.height)
        g.append('text')
          .attr('class', styles.headerMonths)
          .attr('x', 5)
          .attr('y', chartConfig.margin.headerMonths)
          .text(d => monthLabel(d))
      })

    // Initialize zones
    await Promise.all(zones.map(z => z.init()))

    // Draw initial data into zones
    const zoneWrapper = svg.select('#zones')
    zoneWrapper.selectAll('*').remove()

    // How tall is the data plot of each zone?
    const heights = zones.map(z => z.getHeight())

    // Track heights as we draw down the visualization
    const cumulativeOffset: number[] = []
    const zoneHeaderHeight = chartConfig.padding.zone + 14
    await Promise.all(
      zones.map((z, i) => {
        // Create empty container for this zone
        const c = zoneWrapper.append('g').attr('id', `zone-${i}`)

        // For this chart type, each zone gets a boundary and a title (as an example, to be visible where the containers are), drawn here by the chart controller.
        // Since it is the same for each zone, it's done here rather than requiring boilerplate in each zone definition

        // Position the zone container
        const priorZoneHeight =
          i == 0
            ? 0
            : zoneHeaderHeight +
              chartConfig.padding.zone +
              heights[i - 1] +
              chartConfig.padding.zone +
              chartConfig.margin.zone
        const verticalOffset =
          i == 0 ? chartConfig.margin.headerDays + 10 : cumulativeOffset[i - 1] + priorZoneHeight
        cumulativeOffset[i] = verticalOffset
        c.attr('transform', `translate(0,${verticalOffset})`)

        // Draw boundary around the zone
        c.append('rect')
          .attr('class', styles.zoneBg)
          .attr('x', chartConfig.margin.zone)
          .attr('y', 0)
          .attr('width', chartConfig.width - chartConfig.margin.zone * 2)
          .attr(
            'height',
            zoneHeaderHeight + chartConfig.padding.zone + heights[i] + chartConfig.padding.zone,
          )
        // Draw title for the zone
        c.append('rect')
          .attr('x', chartConfig.margin.zone)
          .attr('y', 0)
          .attr('width', chartConfig.width - chartConfig.margin.zone * 2)
          .attr('height', zoneHeaderHeight)
          .attr('style', 'fill: #9c9c7f; fill-opacity: 0.8')
        c.append('text')
          .attr('class', styles.headerZone)
          .attr('x', chartConfig.padding.zone)
          .attr('y', zoneHeaderHeight - 7)
          .text(z.title)

        c.append('clipPath')
          .attr('id', `clip-zone-${i}`)
          .attr('clipPathUnits', 'userSpaceOnUse')
          .append('rect')
          .attr('x', chartConfig.margin.zone + chartConfig.padding.zone)
          .attr('y', 0)
          .attr('height', heights[i])
          .attr(
            'width',
            chartConfig.width - chartConfig.margin.zone * 2 - chartConfig.padding.zone * 2,
          )

        // Container for actual data needs to have a translate X component of zero, so that the Scale has a proper result
        return z.paintData(
          c
            .append('g')
            .attr('class', 'data')
            .attr('clip-path', `url(#clip-zone-${i})`)
            .attr('transform', `translate(0, ${zoneHeaderHeight + chartConfig.padding.zone})`),
          initialX,
        )
      }),
    )
  }

  useEffect(() => {
    if (svgRef.current == null) return
    initializeDashboard()
  }, [svgRef.current])

  return (
    <svg ref={svgRef} style={{ width: '100%', height: '400px', background: '#FFC' }}>
      <g id="grid" />
      <g id="zones" />
      <g id="axis" />
    </svg>
  )
}
