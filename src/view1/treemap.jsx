// src/treemap.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const TreemapChart = ({
  data = [],
  activeUserId,         // 相容舊版的單選（可不傳）
  activeUserIds = [],   // 新版：多選
  onSelect,
  sortKey = 'votes',    // 'votes' | 'pref'
  onRefresh,
  selectedIds = []      // 被父層選取中的 a_id 陣列（決定哪幾格要亮霓虹）
}) => {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // 監聽容器尺寸
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setDimensions((prev) =>
        width > 0 && height > 0 && (width !== prev.width || height !== prev.height)
          ? { width, height }
          : prev
      );
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 建立圓形圖示按鈕（含 stopPropagation）
  function createIconButton(
    group,
    x,
    emoji,
    onClickHandler,
    isActive,
    fallbackEmoji = '❓',
    forceBlack = false
  ) {
    const buttonGroup = group
      .append('g')
      .attr('transform', `translate(${x}, 0)`)
      .style('cursor', 'pointer')
      .on('click', (event) => {
        event.stopPropagation();  // 避免觸發節點 click（onSelect）
        onClickHandler && onClickHandler(event);
      });

    const strokeColor = '#fff';
    const fillColor = forceBlack ? 'black' : isActive ? '#fff' : 'black';

    buttonGroup
      .append('circle')
      .attr('r', 14)
      .attr('fill', fillColor)
      .attr('opacity', 1)
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2);

    if (typeof emoji === 'string' && emoji.startsWith('http')) {
      const image = buttonGroup
        .append('image')
        .attr('href', emoji)
        .attr('x', -10)
        .attr('y', -10)
        .attr('width', 20)
        .attr('height', 20);

      const fallback = buttonGroup
        .append('text')
        .attr('class', 'fallback-emoji')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', '16px')
        .attr('fill', isActive ? 'black' : 'white')
        .attr('opacity', 0)
        .text(fallbackEmoji);

      image.node()?.addEventListener('error', () => {
        image.remove();
        fallback.attr('opacity', 1);
      });
    } else {
      buttonGroup
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', '16px')
        .attr('fill', isActive ? 'black' : 'white')
        .text(emoji);
    }

    return buttonGroup;
  }

  // 投票請求
  function sendVoteToBackend(t_id, a_id, user_id, type, callback) {
    const url = '/api/switchvote';
    const payload = JSON.stringify({ t_id, a_id, user_id, type });

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
      .then(async (res) => {
        const parseResponseJson = async () => {
          try { return await res.json(); } catch { return null; }
        };
        const result = await parseResponseJson();

        if (!res.ok) {
          const errMsg = result?.error || '操作失敗';
          alert(errMsg);
          return;
        }
        callback && callback(result);
      })
      .catch((err) => {
        console.error('送出錯誤:', err);
        alert('無法送出請求');
      });
  }

  // 類別 → 兩端漸層色
  function neonStops(cat) {
    let startColor = '#ddd';
    let endColor   = '#aaa';
    switch ((cat || '').trim()) {
      case 'Culture & Heritage': startColor = '#ffdfba'; endColor = '#ffbf69'; break;
      case 'Scenic Spots':       startColor = '#bae1ff'; endColor = '#baffc9'; break;
      case 'Transport Rides':    startColor = '#f9a1bc'; endColor = '#fbc4ab'; break;
      case 'Discovery Spaces':   startColor = '#dcd6f7'; endColor = '#a6b1e1'; break;
      case 'Public Squares':     startColor = '#c77dff'; endColor = '#ffd6ff'; break;
    }
    return { startColor, endColor };
  }

  /* ───────── 使用者多選集合（元件頂層就先算好） ───────── */
  const activeUserList = (Array.isArray(activeUserIds) && activeUserIds.length)
    ? activeUserIds.map(String)
    : (activeUserId ? [String(activeUserId)] : []);
  const activeSet = new Set(activeUserList);
  const hasSelection = activeSet.size > 0;
  const activeUsersKey = activeUserList.join(',');

  const isActive = (n) => {
    if (!hasSelection) return false;
    const interested = [...(n.data.who_like||[]), ...(n.data.who_love||[])].map(String);
    return interested.some(u => activeSet.has(u));   // 聯集：任一人有喜歡/愛心就高亮
  };
  const OPACITY_ACTIVE = 1.0, OPACITY_INACTIVE = 0.12, OPACITY_DEFAULT = 1.0;
  const nodeOpacity = (d) => (hasSelection ? (isActive(d) ? OPACITY_ACTIVE : OPACITY_INACTIVE) : OPACITY_DEFAULT);

  // 主繪圖
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const { width, height } = dimensions;
    if (!width || !height) return;

    if (!Array.isArray(data) || data.length === 0) {
      d3.select(svgEl).selectAll('*').remove();
      return;
    }

    // 排序＆映射資料（votes / pref 指標）
    const root = d3
      .hierarchy({
        name: 'root',
        children: data
          .slice()
          .sort((a, b) => {
            const aVotes = (a.vote_like || 0) + (a.vote_love || 0);
            const bVotes = (b.vote_like || 0) + (b.vote_love || 0);
            const aPref  = (a.vote_love || 0) * 2 + (a.vote_like || 0);
            const bPref  = (b.vote_love || 0) * 2 + (b.vote_like || 0);

            if (sortKey === 'pref') return (bPref - aPref) || (bVotes - aVotes) || ((b.vote_love||0) - (a.vote_love||0));
            return (bVotes - aVotes) || (bPref - aPref) || ((b.vote_love||0) - (a.vote_love||0));
          })
          .map((d) => {
            const votes = (d.vote_like || 0) + (d.vote_love || 0);
            const pref  = (d.vote_love || 0) * 2 + (d.vote_like || 0);
            const metric = sortKey === 'pref' ? pref : votes;
            return {
              a_id: d.a_id,
              t_id: d.t_id,
              name: d.name_zh || d.name,
              name_zh: d.name_zh,
              name_en: d.name_en,
              address: d.address,
              vote_like: d.vote_like || 0,
              vote_love: d.vote_love || 0,
              category: d.category,
              photo: d.photo,
              who_like: d.who_like || [],
              who_love: d.who_love || [],
              value: Math.max(1, metric),
            };
          }),
      })
      .sum((d) => d.value);

    const treemapLayout = d3.treemap()
      .tile(d3.treemapSquarify.ratio(1))
      .size([width, height])
      .padding(2);

    treemapLayout(root);

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    // ===== 共用 defs（樣式與濾鏡）=====
    const defs = svg.append('defs');

    // 讓外框不斷線、方角、加粗 & 光暈
    defs.append('style').text(`
      svg .neon-ring { pointer-events: none; }
      /* 外層厚實光暈（實線、連續、方角） */
      svg .neon-glow {
        fill: none;
        stroke-linejoin: miter;
        stroke-linecap: butt;
        stroke-dasharray: none !important;
        shape-rendering: crispEdges;
        filter: url(#neon-blur);
        opacity: .9;
        stroke-width: 10;
      }
      /* 內層銳利實線（實線、連續、方角） */
      svg .neon-core {
        fill: none;
        stroke-linejoin: miter;
        stroke-linecap: butt;
        stroke-dasharray: none !important;
        shape-rendering: crispEdges;
        opacity: .98;
        stroke-width: 3.4;
      }
      @keyframes neonPulse { 0%,100% { opacity:.95 } 50% { opacity:.65 } }
      svg .neon-anim { animation: neonPulse 1.6s ease-in-out infinite; }
    `);

    const blur = defs.append('filter').attr('id', 'neon-blur');
    blur.append('feGaussianBlur').attr('stdDeviation', 4.8).attr('result', 'blur');
    const merge = blur.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    // 節點
    const nodes = svg
      .selectAll('g.node')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('class', 'node hoverable')
      .style('cursor', 'pointer')
      .attr('transform', (d) => `translate(${d.x0}, ${d.y0})`)
      .on('click', (event, d) => {
        const t = event.target;
        if (t?.closest && (t.closest('.hover-buttons') || t.closest('.toggle-btn'))) return;
        onSelect?.({ ...d.data });
      });

    nodes.style('opacity', (d) => nodeOpacity(d));

    // 背景圖
    nodes.each(function (d) {
      const group = d3.select(this);
      const img = group
        .append('image')
        .attr('href', d.data.photo)
        .attr('width', d.x1 - d.x0)
        .attr('height', d.y1 - d.y0)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .attr('opacity', 0.8);
      img.node()?.addEventListener('error', () => {
        img.attr(
          'href',
          'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjUZnZYwmGHr3G3y3kkZVcPc7LqkPQ8hxXeXuhIUmDcR4OujR_KuDWMhL9xZcpyUfVpkA0oLmiYXe4wDB5_LbFaLfTs5pZADkq_dMfcGeUcET3u-rId8JWe549FBKlWJq6KjvXlLpV_osMx/s180-c/odekake_umi.png'
        );
      });
    });

    // ===== 書籤背景用的漸層（每片葉子一個，避免衝突）=====
    const leaves = root.leaves();
    leaves.forEach((leaf, i) => {
      const node = leaf.data;
      const grad = defs
        .append('linearGradient')
        .attr('id', `gradient-border-${i}`)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%');

      const { startColor, endColor } = neonStops(node.category);

      grad.selectAll('stop')
        .data([{ offset: '0%', color: startColor }, { offset: '100%', color: endColor }])
        .enter()
        .append('stop')
        .attr('offset', (d) => d.offset)
        .attr('stop-color', (d) => d.color);

      // 漸層緩慢旋轉（裝飾用）
      let angle = 0;
      (function frame() {
        angle = (angle + 2) % 360;
        grad
          .attr('x2', `${Math.cos((angle * Math.PI) / 180) * 100 + 50}%`)
          .attr('y2', `${Math.sin((angle * Math.PI) / 180) * 100 + 50}%`);
        requestAnimationFrame(frame);
      })();
    });

    // 書籤背景 + 標題
    nodes.append('rect')
      .attr('class', 'label-background')
      .attr('x', 0)
      .attr('y', 6)
      .attr('width', (d) => {
        const name = d.data.name || '';
        const fontSize = 12;
        return Math.min((name.length + 2) * fontSize * 0.9, d.x1 - d.x0 - 3);
      })
      .attr('height', 16)
      .attr('fill', (_d, i) => `url(#gradient-border-${i})`)
      .attr('opacity', 0.85);

    nodes.append('text')
      .attr('x', 5)
      .attr('y', 18)
      .text((d) => {
        const w = d.x1 - d.x0, h = d.y1 - d.y0;
        return w > 60 && h > 30 ? d.data.name : '';
      })
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none');

    // Hover 互動（以中心縮放，避免抖動）
    nodes
      .on('mouseenter', function (event, d) {
        d3.select(this).raise();

        nodes.each(function (nodeDatum) {
          if (nodeDatum !== d) {
            d3.select(this)
              .transition().duration(100)
              .style('opacity', 0.3)
              .attr('transform', `translate(${nodeDatum.x0},${nodeDatum.y0}) scale(1)`);
          }
        });

        const boxWidth = d.x1 - d.x0;
        const boxHeight = d.y1 - d.y0;
        const scaleFactor = 1.3;

        const cx = d.x0 + (boxWidth / 2);
        const cy = d.y0 + (boxHeight / 2);

        const thisNode = d3.select(this);
        thisNode.interrupt().raise()
          .transition().duration(200)
          .attr('transform', `
            translate(${cx},${cy})
            scale(${scaleFactor})
            translate(${-cx},${-cy})
          `)
          .style('opacity', 1);

        thisNode.select('image').transition().duration(200).attr('opacity', 1);
        thisNode.select('.overlay-info').style('display', 'block');

        const rectWidth = d.x1 - d.x0;
        const rectHeight = d.y1 - d.y0;

        let leftOffset = rectWidth * 0.2;
        if (leftOffset >= 30) leftOffset = 20;
        if (leftOffset <= 5) leftOffset = 15;
        if (rectWidth <= 70) leftOffset = rectWidth * 0.25;
        if (rectWidth >= 100 && rectWidth < 150) leftOffset = rectWidth * 0.16;

        let bottomOffset = rectHeight * 0.1;
        if (rectHeight >= 100 && rectHeight < 200) bottomOffset = rectHeight * 0.13;
        if (rectHeight <= 100) bottomOffset = rectHeight * 0.2;
        if (bottomOffset >= 20) bottomOffset = 20;

        const hoverGroup = thisNode
          .append('g')
          .attr('class', 'hover-buttons')
          .attr('transform', `translate(${leftOffset}, ${rectHeight - bottomOffset})`);

        const user_id = activeUserList[0] || null;  // 多人時預設用第一位
        const liked = user_id ? (d.data.who_like || []).includes(user_id) : false;
        const loved = user_id ? (d.data.who_love || []).includes(user_id) : false;

        // like
        createIconButton(
          hoverGroup,
          0,
          'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjYi8pOHIrRfNwCLIxIvaPLqOLr2F4KCqZhptxeW_1YKY3FJ9hNrgdr8MX00uFcbvXLcJP05LhN8nfZUXtv8-4ZXQet-HwF4JmLj97-HjYzTg1swTfNeVhbWwlWG3pNWmOMdRc4g6NtJ9FX/s1600/mark_face_smile.png',
          function () {
            if (!user_id) { alert('請先點上方頭像選擇使用者'); return; }
            sendVoteToBackend(d.data.t_id, d.data.a_id, user_id, 'like', (res) => {
              if (res.action === 'removed') d.data.who_like = [];
              else if (res.action === 'switched') { d.data.who_like = [user_id]; d.data.who_love = []; }
              onRefresh && onRefresh();
            });
          },
          liked,
          '😀'
        );

        // heart
        createIconButton(
          hoverGroup,
          32,
          'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg4527o0Xycu0v0Plvi-VwxKuzrg1YXjZ9AAnRDROfCpYh4LZ4SKhVC0nhDPXIpV5EA5Ha5cVHGhH6A1otPLlJecR0qKwh5Tswqidt1kbMF2tUy3rT3cWXF-OpWKndUN22CkkSE63jNzsLe/s1600/mark_face_laugh.png',
          function () {
            if (!user_id) { alert('請先點上方頭像選擇使用者'); return; }
            sendVoteToBackend(d.data.t_id, d.data.a_id, user_id, 'heart', (res) => {
              if (res.action === 'removed') d.data.who_love = [];
              else if (res.action === 'switched') { d.data.who_love = [user_id]; d.data.who_like = []; }
              onRefresh && onRefresh();
            });
          },
          loved,
          '😍'
        );

        // eye（資訊面板）
        createIconButton(
          hoverGroup,
          rectWidth - 40,
          'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEidUxRG8FVurhwqDWSGumS2AUFtPOXvNMarEuaMeMZZ-2QvQy1HriKlmhWE-tvJtJmb2dtt5Z-2CsuZWxlkg0skCpOAYTyR_YxSNn2sX-7koaPXUZBWiG2GgK6ZNr5t-qR0zQZqepKoh0I/s800/mark_manpu12_hirameki.png',
          function (event) {
            event.stopPropagation();
            const eyeGroup = d3.select(this);
            const existing = thisNode.select('.overlay-info');
            if (!existing.empty()) {
              existing.remove();
              eyeGroup.select('circle').attr('fill', 'black').attr('stroke', '#ddd');
              return;
            }
            eyeGroup.select('circle').attr('fill', '#fff').attr('stroke', '#ddd');

            const overlayWidth = rectWidth;
            let overlayHeight = 65;
            let isCollapsed = false;
            let currentOverlayY = rectHeight - 103;

            const overlay = thisNode
              .append('g')
              .attr('class', 'overlay-info')
              .attr('transform', `translate(0, ${currentOverlayY})`)
              .call(d3.drag().on('drag', dragged))
              .raise();

            const overlayBg = overlay
              .append('rect')
              .attr('width', overlayWidth)
              .attr('height', overlayHeight)
              .attr('fill', '#e9ecef')
              .attr('opacity', 0.85)
              .on('click', (e) => e.stopPropagation());

            const infoGroup = overlay.append('g').attr('class', 'info-content');

            function drawInfoContent() {
              infoGroup.selectAll('*').remove();
              if (isCollapsed) {
                overlayHeight = 28;
                infoGroup.append('text')
                  .attr('x', 10).attr('y', 20).attr('fill', 'black').attr('font-size', '11px')
                  .text(`👍 ${d.data.vote_like}  ❤️ ${d.data.vote_love}`);
              } else {
                overlayHeight = 65;
                infoGroup.append('text')
                  .attr('x', 10).attr('y', 20).attr('fill', 'black').attr('font-size', '11px')
                  .text(`👍 ${d.data.vote_like}  ❤️ ${d.data.vote_love}`);
                infoGroup.append('text')
                  .attr('x', 10).attr('y', 38).attr('fill', 'black').attr('font-size', '10px')
                  .text(`👍：${(d.data.who_like || []).join(', ') || '無'}`);
                infoGroup.append('text')
                  .attr('x', 10).attr('y', 55).attr('fill', 'black').attr('font-size', '10px')
                  .text(`❤️：${(d.data.who_love || []).join(', ') || '無'}`);
              }
              overlayBg.attr('height', overlayHeight);
            }
            drawInfoContent();

            const toggleBtn = overlay.append('g')
              .attr('class', 'toggle-btn')
              .attr('transform', `translate(${overlayWidth - 20}, 15)`)
              .on('click', (e) => { e.stopPropagation(); isCollapsed = !isCollapsed; drawInfoContent(); });

            toggleBtn.append('circle').attr('r', 9).attr('fill', '#dee2e6')
              .attr('stroke', '#6c757d').attr('stroke-width', 0.5);
            toggleBtn.append('text')
              .attr('text-anchor', 'middle').attr('alignment-baseline', 'middle')
              .attr('font-size', '10px').attr('fill', '#495057').text('⎘');

            function dragged(event) {
              event.sourceEvent?.stopPropagation?.();
              currentOverlayY += event.dy;
              const minY = rectHeight - 103;
              const maxY = isCollapsed ? rectHeight * 0.72 : rectHeight * 0.57;
              currentOverlayY = Math.max(minY, Math.min(maxY, currentOverlayY));
              overlay.attr('transform', `translate(0, ${currentOverlayY})`);
            }
          },
          false,
          '👁️',
          true
        );
      })
      .on('mouseleave', function () {
        nodes.transition().duration(100)
          .style('opacity', (n) => nodeOpacity(n))
          .attr('transform', (d) => `translate(${d.x0},${d.y0})`);
        const self = d3.select(this);
        self.select('image').transition().duration(200).attr('opacity', 0.8);
        self.select('.hover-buttons').remove();
        self.select('.overlay-info').remove();
      });

    // ===== 依 selectedIds 顯示「實心粗線霓虹（雙色漸層）」外框 =====
    const picked = new Set((selectedIds || []).map(String));

    nodes.each(function (d, i) {
      const g = d3.select(this);
      const w = d.x1 - d.x0, h = d.y1 - d.y0;
      const on = picked.has(String(d.data.a_id));

      const { startColor, endColor } = neonStops(d.data.category);

      // 每格建一個自己的外框漸層，避免 id 撞名
      const gradId = `neon-stroke-${d.data.a_id ?? i}`;
      const strokeGrad = defs.append('linearGradient')
        .attr('id', gradId)
        .attr('x1', '0%').attr('y1', '0%')
        .attr('x2', '100%').attr('y2', '0%');

      strokeGrad.selectAll('stop')
        .data([
          { offset: '0%',   color: startColor },
          { offset: '100%', color: endColor },
        ])
        .enter()
        .append('stop')
        .attr('offset', (s) => s.offset)
        .attr('stop-color', (s) => s.color);

      // 讓外框漸層做緩慢旋轉
      let angle = 0;
      (function spin() {
        angle = (angle + 2) % 360;
        strokeGrad
          .attr('x2', `${Math.cos((angle * Math.PI) / 180) * 100 + 50}%`)
          .attr('y2', `${Math.sin((angle * Math.PI) / 180) * 100 + 50}%`);
        requestAnimationFrame(spin);
      })();

      const ring = g.append('g')
        .attr('class', 'neon-ring')
        .style('visibility', on ? 'visible' : 'hidden');

      // 外層厚實光暈（實線、連續、直角）
      ring.append('rect')
        .attr('class', 'neon-glow neon-anim')
        .attr('x', 1.5).attr('y', 1.5)
        .attr('width', Math.max(0, w - 3))
        .attr('height', Math.max(0, h - 3))
        .attr('rx', 0).attr('ry', 0)
        .attr('stroke', `url(#${gradId})`);

      // 內層銳利實線（同一個漸層）
      ring.append('rect')
        .attr('class', 'neon-core')
        .attr('x', 1.5).attr('y', 1.5)
        .attr('width', Math.max(0, w - 3))
        .attr('height', Math.max(0, h - 3))
        .attr('rx', 0).attr('ry', 0)
        .attr('stroke', `url(#${gradId})`);
    });

  }, [data, dimensions, sortKey, selectedIds, activeUsersKey]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} />
    </div>
  );
};

export default TreemapChart;
