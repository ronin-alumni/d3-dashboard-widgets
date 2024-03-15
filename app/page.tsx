'use client'

import GantTimeline from '@/components/GanttTimeline'

export default function Home() {
  return (
    <main>
      <h1>D3 Dashboard Widgets</h1>
      <div style={{ width: '100%' }}>
        <GantTimeline />
      </div>
    </main>
  )
}
