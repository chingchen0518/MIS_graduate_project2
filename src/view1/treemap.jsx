// treemap.jsx (最終解決裁切問題版本)
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const TreemapChart = ({ data, activeUserId, onSelect }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && (width !== dimensions.width || height !== dimensions.height)) {
          setDimensions({ width, height });
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [dimensions.width, dimensions.height]);

  useEffect(() => {
    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (width === 0 || height === 0 || !data || data.length === 0) return;

    const categoryColorMap = {
      'History & Religion': { bg: '#fae588', border: '#FBC02D' },
      'Art & Museums':      { bg: '#cfe1b9', border: '#8BC34A' },
      'Scenic Spots':       { bg: '#669bbc', border: '#03A9F4' },
      'Transport Rides':    { bg: '#f25c54', border: '#F44336' },
      'default':            { bg: '#ccc',    border: '#9E9E9E' },
    };
    const getColor = (category, type = 'bg') => (categoryColorMap[category] || categoryColorMap.default)[type];

    const root = d3.hierarchy({
      name: 'root',
      children: data.slice().sort((a, b) => (b.vote_like + b.vote_love) - (a.vote_like + a.vote_love)).map(d => ({
        ...d,
        name: d.name_zh || d.name,
        value: Math.max(1, (d.vote_like ?? 0) + (d.vote_love ?? 0)),
      })),
    }).sum(d => d.value);

    // 【關鍵修改 1】增加 Treemap 佈局的 padding
    const treemapLayout = d3.treemap()
      .tile(d3.treemapSquarify.ratio(1))
      .size([width, height])
      .paddingOuter(10) // 在最外圍增加 10px 的間距
      .paddingInner(5); // 內部格子之間的間距

    treemapLayout(root);

    const isActive = (n) => activeUserId && (n.data.who_like?.includes(activeUserId) || n.data.who_love?.includes(activeUserId));
    const OPACITY_ACTIVE = 1.0, OPACITY_INACTIVE = 0.1, OPACITY_DEFAULT = 0.8;
    const nodeOpacity = d => activeUserId ? (isActive(d) ? OPACITY_ACTIVE : OPACITY_INACTIVE) : OPACITY_DEFAULT;

    const nodes = svg.selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x0}, ${d.y0})`)
      .attr('class', 'hoverable')
      .style('cursor', 'pointer')
      .on('click', function (event, d) { if (typeof onSelect === 'function') onSelect(d.data); });

    nodes.append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => getColor(d.data.category, 'bg'))
      .attr('opacity', nodeOpacity);

    nodes.append('image')
      .attr('href', d => d.data.photo)
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('preserveAspectRatio', 'xMidYMid slice')
      .attr('opacity', nodeOpacity);

    nodes.append('text')
      .attr('x', 5).attr('y', 18)
      .text(d => (d.x1 - d.x0 > 60 && d.y1 - d.y0 > 30) ? d.data.name : '')
      .attr('font-size', '12px').attr('fill', 'white').attr('font-weight', 'bold')
      .style('text-shadow', '0 0 3px rgba(0,0,0,0.7)').attr('pointer-events', 'none')
      .attr('opacity', d => activeUserId ? (isActive(d) ? 1 : OPACITY_INACTIVE) : 1);

    nodes.append('rect')
      .attr('class', 'animated-border')
      .attr('x', -2).attr('y', -2)
      .attr('width', d => d.x1 - d.x0 + 4)
      .attr('height', d => d.y1 - d.y0 + 4)
      .attr('fill', 'none').attr('stroke-width', 3)
      .attr('stroke', d => {
        if (activeUserId) return isActive(d) ? getColor(d.data.category, 'border') : 'none';
        return getColor(d.data.category, 'border');
      }).lower();

    nodes.on('mouseenter', function (event, d) {
      d3.select(this).raise();
      nodes.transition().duration(150).style('opacity', n => {
        if (n === d) return 1;
        return activeUserId ? (isActive(n) ? OPACITY_ACTIVE : 0.05) : 0.3;
      });
      // 【關鍵修改 2】Hover 效果保持在 SVG 內部
      const scale = 1.1;
      const newWidth = (d.x1 - d.x0) * scale;
      const newHeight = (d.y1 - d.y0) * scale;
      const newX = d.x0 - (newWidth - (d.x1 - d.x0)) / 2;
      const newY = d.y0 - (newHeight - (d.y1 - d.y0)) / 2;

      d3.select(this).transition().duration(200)
        .attr('transform', `translate(${newX}, ${newY})`)
        .selectAll('rect, image')
        .attr('width', newWidth)
        .attr('height', newHeight);
    }).on('mouseleave', function (event, d) {
      nodes.transition().duration(150).style('opacity', nodeOpacity);
      d3.select(this).transition().duration(200)
        .attr('transform', `translate(${d.x0}, ${d.y0})`)
        .selectAll('rect, image')
        .attr('width', d.x1 - d.x0)
        .attr('height', d.y1 - d.y0);
    });
  }, [data, dimensions, activeUserId, onSelect]);

  // 【關鍵修改 3】移除 style 中的 overflow: hidden
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height}></svg>
    </div>
  );
};

export default TreemapChart;
