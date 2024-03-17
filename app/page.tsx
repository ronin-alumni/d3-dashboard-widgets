'use client'

import GantTimeline, { D3ZonePainter } from '@/components/GanttTimeline'

function daysShift(start: Date, daysDelta: number): Date {
  const d = new Date(start.getTime())
  d.setDate(d.getDate() + daysDelta)
  return d
}

const now = new Date()

// Draw box-style visualization, taking up multiple rows
const barHeight = 10
const barGap = 5
const zone1: D3ZonePainter = {
  data: [],
  title: 'Boxes',
  init: async function () {
    // In a real scenario, this would likely be an API call. Using static fixture here as an example
    this.data = [
      {
        startDate: daysShift(now, -5),
        endDate: now,
      },
      {
        startDate: daysShift(now, -15),
        endDate: daysShift(now, -1),
      },
      {
        startDate: daysShift(now, -2),
        endDate: daysShift(now, 3),
      },
      {
        startDate: daysShift(now, -50),
        endDate: daysShift(now, -7),
      },
    ]
    return true
  },
  getHeight: function () {
    return (barHeight + barGap) * this.data.length - barGap // Remove gap from last bar, for true height
  },
  paintData: async function (container, x) {
    container
      .attr('style', 'stroke: #008; stroke-width: 1px; fill: #00F; fill-opacity: 0.1')
      .selectAll('rect')
      .data(this.data)
      .join(
        enter =>
          enter
            .append('rect')
            .attr('x', d => Math.floor(x(d.startDate)) + 0.5)
            .attr('y', (d, i) => i * (barHeight + barGap) + 0.5)
            .attr('width', d => x(d.endDate) - x(d.startDate))
            .attr('height', barHeight),
        update =>
          update.attr('x', d => x(d.startDate)).attr('width', d => x(d.endDate) - x(d.startDate)),
      )
    return true
  },
}

// Draw dot-style markers, only taking up one row of space
const dotRadius = 10
const zone2: D3ZonePainter = {
  data: [],
  title: 'Dots',
  init: async function () {
    // In a real scenario, this would likely be an API call. Using static fixture here as an example
    this.data = [
      {
        date: daysShift(now, -20),
        label: 'A',
      },
      {
        date: daysShift(now, -19),
        label: 'A',
      },
      {
        date: daysShift(now, -12),
        label: 'B',
      },
      {
        date: daysShift(now, -4),
        label: 'C',
      },
      {
        date: daysShift(now, 2),
        label: 'A',
        style: 'fill: #AAF',
      },
    ]
    return true
  },
  getHeight: function () {
    return dotRadius * 2
  },
  paintData: async function (container, x) {
    container
      .attr('style', 'fill: #aaa;')
      .selectAll('circle')
      .data(this.data)
      .join(enter =>
        enter
          .append('g')
          .attr('transform', d => `translate(${Math.floor(x(d.date))}, ${dotRadius})`)
          .call(g => {
            g.append('circle')
              .attr('cx', 0)
              .attr('cy', 0)
              .attr('r', dotRadius)
              .attr('style', d => d.style)
            g.append('text')
              .attr('text-anchor', 'middle')
              .attr(
                'style',
                'fill: #000; font-size:12px; font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;',
              )
              .attr('x', 0)
              .attr('y', 4)
              .text(d => d.label)
          }),
      )
    return true
  },
}

export default function Home() {
  return (
    <main>
      <h1>D3 Dashboard Widgets</h1>
      <div style={{ width: '100%' }}>
        <GantTimeline zones={[zone1, zone2]} />
      </div>
    </main>
  )
}
