import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useAuth } from '../../hooks/useAuth'
import { useContent } from '../../hooks/useContent'
import Sidebar from '../../components/Sidebar/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import { Network, MousePointer2, Search, Pointer, Brain, X } from 'lucide-react'
import styles from './KnowledgeGraph.module.css'

const typeColors = {
  article: '#6366f1',
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
    if (!svgRef.current) return
    const timer = setTimeout(() => { if (svgRef.current) buildGraph() }, 100)
    return () => clearTimeout(timer)
  }, [content, loading])

  useEffect(() => {
    const handleResize = () => { if (content.length && svgRef.current) buildGraph() }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [content])

  function buildGraph() {
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    const nodes = content.map(item => ({
      id: item.id,
      title: item.title || 'Untitled',
      type: item.type,
      category: item.category,
      tags: item.tags || [],
      summary: item.summary,
      color: typeColors[item.type] || '#6366f1'
    }))

    const links = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j]
        const sharedTags = a.tags.filter(t => b.tags.some(bt => bt.toLowerCase() === t.toLowerCase()))
        if (sharedTags.length > 0) {
          links.push({ source: a.id, target: b.id, strength: sharedTags.length, shared: sharedTags, type: 'tag' })
        } else if (a.category === b.category) {
          links.push({ source: a.id, target: b.id, strength: 0, shared: [], type: 'category' })
        }
      }
    }

    const categories = [...new Set(nodes.map(n => n.category))]
    const categoryAngles = {}
    categories.forEach((cat, i) => { categoryAngles[cat] = (2 * Math.PI * i) / categories.length })

    nodes.forEach(node => {
      const angle = categoryAngles[node.category] || 0
      const radius = Math.min(width, height) * 0.28
      node.x = width / 2 + radius * Math.cos(angle) + (Math.random() - 0.5) * 60
      node.y = height / 2 + radius * Math.sin(angle) + (Math.random() - 0.5) * 60
    })

    const categoryGroups = {}
    nodes.forEach(node => {
      if (!categoryGroups[node.category]) categoryGroups[node.category] = []
      categoryGroups[node.category].push(node)
    })

    const zoom = d3.zoom().scaleExtent([0.3, 3]).on('zoom', (event) => g.attr('transform', event.transform))
    svg.call(zoom)

    const g = svg.append('g')

    const defs = svg.append('defs')
    const filter = defs.append('filter').attr('id', 'glow')
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur')
    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id)
        .distance(d => d.type === 'tag' ? 100 : 150)
        .strength(d => d.type === 'tag' ? 0.3 + d.strength * 0.1 : 0.05)
      )
      .force('charge', d3.forceManyBody().strength(-280))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(48))
      .force('boundary', () => {
        const padding = 55
        nodes.forEach(node => {
          node.x = Math.max(padding, Math.min(width - padding, node.x || width / 2))
          node.y = Math.max(padding, Math.min(height - padding, node.y || height / 2))
        })
      })

    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => d.type === 'tag' ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.07)')
      .attr('stroke-width', d => d.type === 'tag' ? 1.5 + d.strength * 0.5 : 1)
      .attr('stroke-dasharray', d => d.type === 'category' ? '4,4' : 'none')

    const catLabels = g.append('g').attr('class', 'cat-labels')
    Object.entries(categoryGroups).forEach(([cat]) => {
      catLabels.append('text')
        .attr('class', `cat-label-${cat.replace(/[\s/]+/g, '-')}`)
        .attr('font-size', '9px')
        .attr('fill', 'rgba(255,255,255,0.14)')
        .attr('text-anchor', 'middle')
        .attr('font-weight', '700')
        .attr('letter-spacing', '2px')
        .attr('pointer-events', 'none')
        .text(cat?.toUpperCase())
    })

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
        .on('drag', (event, d) => {
          const padding = 55
          d.fx = Math.max(padding, Math.min(width - padding, event.x))
          d.fy = Math.max(padding, Math.min(height - padding, event.y))
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null; d.fy = null
        })
      )

    // Outer ambient ring
    node.append('circle')
      .attr('r', 30)
      .attr('fill', d => d.color + '12')
      .attr('stroke', d => d.color + '45')
      .attr('stroke-width', 1.5)

    // Main filled circle
    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => d.color + '55')
      .attr('stroke', d => d.color)
      .attr('stroke-width', 2)
      .attr('filter', 'url(#glow)')

    // Icon
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', '12px')
      .text(d => ({ article: '📄', youtube: '▶', tweet: '🐦', note: '📝', image: '🖼' }[d.type] || '📄'))

    // Label
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 42)
      .attr('font-size', '10.5px')
      .attr('fill', 'rgba(180,180,210,0.7)')
      .attr('pointer-events', 'none')
      .text(d => d.title.length > 18 ? d.title.slice(0, 18) + '…' : d.title)

    node.on('click', (event, d) => {
      event.stopPropagation()
      setSelectedNode(d)
      const connectedIds = new Set()
      links.forEach(l => {
        if (l.source.id === d.id) connectedIds.add(l.target.id)
        if (l.target.id === d.id) connectedIds.add(l.source.id)
      })
      node.selectAll('circle').attr('opacity', n => n.id === d.id || connectedIds.has(n.id) ? 1 : 0.12)
      link
        .attr('opacity', l => l.source.id === d.id || l.target.id === d.id ? 1 : 0.04)
        .attr('stroke', l => l.source.id === d.id || l.target.id === d.id ? 'rgba(167,139,250,0.9)' : 'rgba(99,102,241,0.08)')
        .attr('stroke-width', l => l.source.id === d.id || l.target.id === d.id ? 2 : 1)
    })

    svg.on('click', () => {
      setSelectedNode(null)
      node.selectAll('circle').attr('opacity', 1)
      link
        .attr('opacity', 0.4)
        .attr('stroke', d => d.type === 'tag' ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.07)')
        .attr('stroke-width', d => d.type === 'tag' ? 1.5 + d.strength * 0.5 : 1)
    })

    node.on('mouseover', (event, d) => {
      setTooltip({ visible: true, x: event.pageX, y: event.pageY, data: d })
      d3.select(event.currentTarget).select('circle:nth-child(2)')
        .transition().duration(150).attr('r', 24)
    }).on('mousemove', (event) => {
      setTooltip(prev => ({ ...prev, x: event.pageX, y: event.pageY }))
    }).on('mouseout', (event) => {
      setTooltip(prev => ({ ...prev, visible: false }))
      d3.select(event.currentTarget).select('circle:nth-child(2)')
        .transition().duration(150).attr('r', 20)
    })

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y)
      node.attr('transform', d => `translate(${d.x},${d.y})`)
      Object.entries(categoryGroups).forEach(([cat, catNodes]) => {
        const cx = catNodes.reduce((s, n) => s + (n.x || 0), 0) / catNodes.length
        const cy = catNodes.reduce((s, n) => s + (n.y || 0), 0) / catNodes.length
        const safeClass = cat.replace(/[\s/]+/g, '-')
        catLabels.select(`.cat-label-${safeClass}`).attr('x', cx).attr('y', cy - 48)
      })
    })

    simulation.on('end', () => {
      svg.transition().duration(600).call(
        zoom.transform,
        d3.zoomIdentity.translate(width / 2, height / 2).scale(0.9).translate(-width / 2, -height / 2)
      )
    })
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>

        {/* ── Header row ── */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <h1 className={styles.title}><Network size={26} className={styles.titleIcon} /> Knowledge Graph</h1>
            <p className={styles.subtitle}>{content.length} nodes · connected by shared tags</p>
          </div>
          <div className={styles.legend}>
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: color }} />
                <span style={{ textTransform: 'capitalize' }}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Link legend ── */}
        <motion.div className={styles.linkLegend} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <span className={styles.linkLegendItem}>
            <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="rgba(99,102,241,0.8)" strokeWidth="2"/></svg>
            Shared tags
          </span>
          <span className={styles.linkLegendItem}>
            <svg width="24" height="8"><line x1="0" y1="4" x2="24" y2="4" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4,3"/></svg>
            Same category
          </span>
        </motion.div>

        {/* ── Hints ── */}
        <motion.div className={styles.hints} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <span className={styles.hintItem}><MousePointer2 size={11} /> Drag to reposition</span>
          <span className={styles.dot}>·</span>
          <span className={styles.hintItem}><Search size={11} /> Scroll to zoom</span>
          <span className={styles.dot}>·</span>
          <span className={styles.hintItem}><Pointer size={11} /> Click to see connections</span>
        </motion.div>

        {/* ── Graph canvas ── */}
        <motion.div
          className={styles.graphWrapper}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          {loading ? (
            <div className={styles.empty}>Loading your knowledge graph...</div>
          ) : content.length < 2 ? (
            <div className={styles.empty}>
              <Brain size={44} className={styles.emptyIcon} />
              <p>Save at least 2 items to see connections!</p>
              <p className={styles.emptyHint}>Go to Dashboard and save some links or notes.</p>
            </div>
          ) : (
            <svg ref={svgRef} className={styles.svg} />
          )}
        </motion.div>

        {/* ── Tooltip ── */}
        {tooltip.visible && tooltip.data && (
          <div className={styles.tooltip} style={{ left: tooltip.x + 15, top: tooltip.y - 10 }}>
            <p className={styles.tooltipTitle}>{tooltip.data.title}</p>
            <p className={styles.tooltipType}>{tooltip.data.type} · {tooltip.data.category}</p>
            {tooltip.data.tags?.length > 0 && (
              <p className={styles.tooltipTags}>{tooltip.data.tags.slice(0, 3).map(t => `#${t}`).join(' ')}</p>
            )}
          </div>
        )}

        {/* ── Node detail panel ── */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              className={styles.panel}
              initial={{ opacity: 0, x: 20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>{selectedNode.title}</h3>
                <button onClick={() => setSelectedNode(null)} className={styles.panelClose}><X size={15} /></button>
              </div>
              <span className={styles.panelType} style={{ background: selectedNode.color + '20', color: selectedNode.color }}>
                {selectedNode.type}
              </span>
              <p className={styles.panelSummary}>{selectedNode.summary}</p>
              <div className={styles.panelTags}>
                {selectedNode.tags?.map(tag => <span key={tag} className={styles.panelTag}>#{tag}</span>)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>
    </div>
  )
}