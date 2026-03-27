import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useAuth } from '../../hooks/useAuth'
import { useContent } from '../../hooks/useContent'
import Sidebar from '../../components/Sidebar/Sidebar'
import styles from './KnowledgeGraph.module.css'

const typeColors = {
  article: '#7c3aed',
  youtube: '#ef4444',
  tweet: '#3b82f6',
  note: '#10b981',
  image: '#f59e0b'
}

export default function KnowledgeGraph() {
  const svgRef = useRef(null)
  const { user } = useAuth()
  const { content, loading } = useContent(user?.id)
  const [selectedNode, setSelectedNode] = useState(null)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null })

 useEffect(() => {
  if (!content.length || loading) return
  if (!svgRef.current) return  // ADD THIS LINE
  
  // Small delay to ensure SVG is rendered
  const timer = setTimeout(() => {
    if (svgRef.current) buildGraph()
  }, 100)
  
  return () => clearTimeout(timer)
}, [content, loading])

useEffect(() => {
  const handleResize = () => {
    if (content.length && svgRef.current) buildGraph()
  }
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [content])

  function buildGraph() {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Build nodes from content
    const nodes = content.map(item => ({
      id: item.id,
      title: item.title || 'Untitled',
      type: item.type,
      category: item.category,
      tags: item.tags || [],
      summary: item.summary,
      color: typeColors[item.type] || '#7c3aed'
    }))

    // Build links based on shared tags/category
    const links = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const sharedTags = a.tags.filter(t => b.tags.includes(t))
        if (sharedTags.length > 0 || a.category === b.category) {
          links.push({
            source: a.id,
            target: b.id,
            strength: sharedTags.length,
            shared: sharedTags
          })
        }
      }
    }

    // Zoom
    const zoom = d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => g.attr('transform', event.transform))

    svg.call(zoom)

    const g = svg.append('g')

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(120)
        .strength(d => 0.1 + d.strength * 0.05)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50))

    // Draw links
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', 'rgba(124,58,237,0.25)')
      .attr('stroke-width', d => 1 + d.strength * 0.5)

    // Category label rings
    const categoryGroup = g.append('g')

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null; d.fy = null
        })
      )

    // Glow filter
    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Outer ring
    node.append('circle')
      .attr('r', 28)
      .attr('fill', d => d.color + '20')
      .attr('stroke', d => d.color + '60')
      .attr('stroke-width', 1)

    // Inner circle
    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => d.color + '40')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)')

    // Type emoji
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '14px')
      .text(d => {
        const icons = { article: '📄', youtube: '▶', tweet: '🐦', note: '📝', image: '🖼' }
        return icons[d.type] || '📄'
      })

    // Title label
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 38)
      .attr('font-size', '11px')
      .attr('fill', '#9090aa')
      .text(d => d.title.length > 20 ? d.title.slice(0, 20) + '…' : d.title)

    // Click handler
    node.on('click', (event, d) => {
      event.stopPropagation()
      setSelectedNode(d)

      // Highlight connected nodes
      const connectedIds = new Set()
      links.forEach(l => {
        if (l.source.id === d.id) connectedIds.add(l.target.id)
        if (l.target.id === d.id) connectedIds.add(l.source.id)
      })

      node.selectAll('circle')
        .attr('opacity', n => n.id === d.id || connectedIds.has(n.id) ? 1 : 0.2)
      link
        .attr('opacity', l => l.source.id === d.id || l.target.id === d.id ? 1 : 0.1)
        .attr('stroke', l => l.source.id === d.id || l.target.id === d.id
          ? 'rgba(167,139,250,0.8)' : 'rgba(124,58,237,0.15)')
    })

    // Click background to deselect
    svg.on('click', () => {
      setSelectedNode(null)
      node.selectAll('circle').attr('opacity', 1)
      link.attr('opacity', 0.4).attr('stroke', 'rgba(124,58,237,0.25)')
    })

    // Hover tooltip
    node.on('mouseover', (event, d) => {
      setTooltip({ visible: true, x: event.pageX, y: event.pageY, data: d })
    }).on('mousemove', (event) => {
      setTooltip(prev => ({ ...prev, x: event.pageX, y: event.pageY }))
    }).on('mouseout', () => {
      setTooltip(prev => ({ ...prev, visible: false }))
    })

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
      node.attr('transform', d => `translate(${d.x},${d.y})`)
    })
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>🕸️ Knowledge Graph</h1>
            <p className={styles.subtitle}>
              {content.length} nodes · connections based on shared tags & categories
            </p>
          </div>
          <div className={styles.legend}>
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: color }} />
                <span>{type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.graphWrapper}>
          {loading ? (
            <div className={styles.empty}>Loading your knowledge graph...</div>
          ) : content.length < 2 ? (
            <div className={styles.empty}>
              <p>🧠 Save at least 2 items to see connections!</p>
              <p className={styles.emptyHint}>Go to Dashboard and save some links or notes.</p>
            </div>
          ) : (
            <svg ref={svgRef} className={styles.svg} />
          )}
        </div>

        {/* Tooltip */}
        {tooltip.visible && tooltip.data && (
          <div
            className={styles.tooltip}
            style={{ left: tooltip.x + 15, top: tooltip.y - 10 }}
          >
            <p className={styles.tooltipTitle}>{tooltip.data.title}</p>
            <p className={styles.tooltipType}>{tooltip.data.type} · {tooltip.data.category}</p>
          </div>
        )}

        {/* Selected node panel */}
        {selectedNode && (
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>{selectedNode.title}</h3>
              <button onClick={() => setSelectedNode(null)} className={styles.panelClose}>✕</button>
            </div>
            <span className={styles.panelType}
              style={{ background: selectedNode.color + '30', color: selectedNode.color }}>
              {selectedNode.type}
            </span>
            <p className={styles.panelSummary}>{selectedNode.summary}</p>
            <div className={styles.panelTags}>
              {selectedNode.tags?.map(tag => (
                <span key={tag} className={styles.panelTag}>#{tag}</span>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}