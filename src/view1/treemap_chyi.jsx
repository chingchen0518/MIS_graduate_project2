// treemap_chyi.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import axios from 'axios';

/* ---------------------------------------
 * 你原本的 TreemapChart 不動（只做 1 處小修：把 value 的計算改成更安全）
 * -------------------------------------*/
export const TreemapChart = ({ data, width = 900, height = 500, onRefresh }) => {
  const ref = useRef();
  const rightRef = useRef(null);
  const dropW = Math.round(width * 0.4);

  function createIconButton(group, x, emoji, onClickHandler, isActive, fallbackEmoji = '❓', forceBlack = false) {
    const buttonGroup = group.append('g')
      .attr('transform', `translate(${x}, 0)`)
      .style('cursor', 'pointer')
      .on('click', onClickHandler);

    const strokeColor = '#fff';
    const fillColor = forceBlack ? 'black' : (isActive ? '#fff' : 'black');

    buttonGroup.append('circle')
      .attr('r', 14)
      .attr('fill', fillColor)
      .attr('opacity', 1)
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2);

    if (typeof emoji === 'string' && (emoji.startsWith('http') || emoji.startsWith('/'))) {
      const image = buttonGroup.append('image')
        .attr('href', emoji)
        .attr('x', -10)
        .attr('y', -10)
        .attr('width', 20)
        .attr('height', 20);

      const fallback = buttonGroup.append('text')
        .attr('class', 'fallback-emoji')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', '16px')
        .attr('fill', isActive ? 'black' : 'white')
        .attr('opacity', 0)
        .text(fallbackEmoji);

      image.node().addEventListener('error', () => {
        image.remove();
        fallback.attr('opacity', 1);
      });
    } else {
      buttonGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', '16px')
        .attr('fill', isActive ? 'black' : 'white')
        .text(emoji);
    }
  }

  function sendVoteToBackend(t_id, a_id, user_id, type, callback) {
    console.log('🧪 投票送出資料：', {
      t_id,
      a_id,
      user_id,
      type
    });
    
    const url = 'http://localhost:3001/api/switchvote';
    const payload = JSON.stringify({ t_id, a_id, user_id, type });

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
      .then(async res => {
        const parseResponseJson = async () => {
          try { return await res.json(); } catch { return null; }
        };
        const result = await parseResponseJson();
        if (!res.ok) {
          alert(result?.error || '操作失敗');
          return;
        }
        if (callback) callback(result);
      })
      .catch(err => {
        console.error('送出錯誤:', err);
        alert('無法送出請求');
      });
  }

  useEffect(() => {
    if (!data || data.length === 0) return;

    async function fetchAvatarsByAccounts(accounts = []) {
      const uniq = [...new Set(accounts.map(a => (a || '').toString().trim().toLowerCase()))];
      if (uniq.length === 0) return {};
      const q = encodeURIComponent(uniq.join(','));
      const r = await fetch(`http://localhost:3001/api/users-info?accounts=${q}`);
      if (!r.ok) return {};
      return r.json();
    }

    function toImgHref(p) {
      if (!p) return '/img/p.png';
      return (p.startsWith('http') || p.startsWith('/')) ? p : `/img/${p}`;
    }

    let isDragging = false;
    let activeEl = null;
    let activeData = null;

    const root = d3.hierarchy({
      name: 'root',
      children: data
        .slice()
        .sort((a, b) => {
          const aTotal = (a.vote_like || 0) + (a.vote_love || 0);
          const bTotal = (b.vote_like || 0) + (b.vote_love || 0);
          if (aTotal !== bTotal) return bTotal - aTotal;
          return (b.vote_love || 0) - (a.vote_love || 0);
        })
        .map(d => ({
          a_id: d.a_id,
          t_id: d.t_id,
          name: d.name_zh || d.name,
          vote_like: d.vote_like ?? 0,
          vote_love: d.vote_love ?? 0,
          category: d.category,
          photo: d.photo || d.image_url || '/img/p.png',
          who_like: Array.isArray(d.who_like)
            ? d.who_like
            : (typeof d.who_like === 'string' ? JSON.parse(d.who_like || '[]') : []),
          who_love: Array.isArray(d.who_love)
            ? d.who_love
            : (typeof d.who_love === 'string' ? JSON.parse(d.who_love || '[]') : []),
          // ✅ 小修：安全的 value 計算
          value: Math.max(1, (d.vote_like || 0) + (d.vote_love || 0)),
        })),
    }).sum(d => d.value);

    const treemapLayout = d3.treemap()
      .tile(d3.treemapSquarify.ratio(1))
      .size([width, height])
      .padding(2);

    treemapLayout(root);

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const nodes = svg.selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('class', 'tile')
      .each(function (d) {
        d.__x = d.x0; d.__y = d.y0;
        d.__w = d.x1 - d.x0; d.__h = d.y1 - d.y0;
      })
      .attr('transform', d => `translate(${d.__x}, ${d.__y})`)
      .attr('data-aid', d => d.data.a_id)
      .attr('id', d => `tile-${d.data.a_id}`);

    // 加上照片疊在底色上
    nodes.each(function (d) {
      const group = d3.select(this);
      const img = group.append('image')
        .attr('href', d.data.photo)
        .attr('width', d => d.__w)
        .attr('height', d => d.__h)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .attr('fill', '#000')
        .attr('opacity', 0.75);

      img.node().addEventListener('error', function handler() {
        this.removeEventListener('error', handler);
        img.attr('href', '/img/p.png');
      });
    });

    // 先畫書籤背景（在下層）
    nodes.append('rect')
      .attr('class', 'label-background')
      .attr('x', 0)
      .attr('y', 6)
      .attr('width', d => {
        const name = d.data.name || '';
        const fontSize = 12;
        return Math.min((name.length + 2) * fontSize * 0.9, d.x1 - d.x0 - 3);
      })
      .attr('height', 16)
      .attr('fill', (d, i) => `url(#gradient-border-${i})`)
      .attr('opacity', 0.85);

    // 再畫文字（在上層）
    nodes.append('text')
      .attr('x', 5)
      .attr('y', 18)
      .text(d => {
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        return w > 60 && h > 30 ? (d.data.name || '') : '';
      })
      .attr('font-size', '12px')
      .attr('fill', 'white')
      .attr('font-weight', 'bold')
      .attr('pointer-events', 'none');

    nodes.on('mouseenter', function (event, d) {
        if (isDragging) return;            // 拖曳時不進入 hover 動畫

        // 只把「上一個被放大」的 tile 復原，不要全場復原（避免閃）
        if (activeEl && activeEl !== this) {
          d3.select(activeEl)
            .interrupt()
            .attr('transform', `translate(${activeData.__x},${activeData.__y}) scale(1)`)
            .style('opacity', 1)
            .selectAll('.hover-buttons,.overlay-info').remove(); // 只清前一個的 UI
        }

        // 準備本次 hover
        d3.select(this).interrupt();
        activeEl = this;
        activeData = d;

        d3.select(this).raise();
        const thisNode = d3.select(this);

        nodes.each(function (n) {
          if (n !== d) {
            d3.select(this)
              .attr('transform', `translate(${n.__x},${n.__y}) scale(1)`)
              .transition().duration(120)
              .style('opacity', 0.35);
          }
        });

        d3.select(this).transition().duration(120).style('opacity', 1);

        // === 放大位移與尺寸改用 __x/__y/__w/__h ===
        const boxWidth = d.__w;      // 原本是 d.x1 - d.x0
        const boxHeight = d.__h;     // 原本是 d.y1 - d.y0
        const scaleFactor = 1.3;
        const margin = 10;
        const scaledWidth = boxWidth * scaleFactor;
        const scaledHeight = boxHeight * scaleFactor;

        let dx = d.__x - (scaledWidth - boxWidth) / 2;  // 原本用 d.x0
        let dy = d.__y - (scaledHeight - boxHeight) / 2; // 原本用 d.y0

        // 邊界限制（以畫布 width/height 為準）
        if (dx < margin) dx = margin;
        if (dx + scaledWidth > width - margin) dx = width - margin - scaledWidth;
        if (dy < margin) dy = margin;
        if (dy + scaledHeight > height - margin) dy = height - margin - scaledHeight;

        thisNode
          .raise()
          .transition().duration(200)
          .attr('transform', `translate(${dx},${dy}) scale(${scaleFactor})`)
          .style('opacity', 1);

        thisNode.select('image').transition().duration(200).attr('opacity', 1);
        thisNode.select('.overlay-info').style('display', 'block');

        // 之後所有寬高也用目前尺寸
        const rectWidth = d.__w;     // 原本是 d.x1 - d.x0
        const rectHeight = d.__h;    // 原本是 d.y1 - d.y0

        // 動態計算左邊的距離
        let leftOffset = rectWidth * 0.2;
        if (leftOffset >= 30) leftOffset = 20;
        if (leftOffset <= 5) leftOffset = 15;
        if (rectWidth <= 70) leftOffset = rectWidth * 0.25;
        if (rectWidth >= 100 && rectWidth < 150)
          leftOffset = rectWidth * 0.16;

        // 距離底部的高度
        let bottomOffset = rectHeight * 0.1;
        if (rectHeight >= 100 && rectHeight < 200) bottomOffset = rectHeight * 0.13;
        if (rectHeight <= 100) bottomOffset = rectHeight * 0.2;
        if (bottomOffset >= 20) bottomOffset = 20;
        

        const hoverGroup = thisNode.append('g')
          .attr('class', 'hover-buttons')
          .attr('transform', `translate(${leftOffset}, ${rectHeight - bottomOffset})`);


        const user_id = 'aaa';
        const liked = d.data.who_like.includes(user_id);
        const loved = d.data.who_love.includes(user_id);

        // 😀 like 按鈕
        createIconButton(
          hoverGroup,
          0,
          '/img/oneheart.png',
          function () {
            if (d.data._voting) return;
            d.data._voting = true;

            // 先顯示一條提示，確保即使 callback 還沒回來也看得到
            showToast(hoverGroup, 0, '已表達意見');

            sendVoteToBackend(d.data.t_id, d.data.a_id, user_id, 'like', (res) => {
              let msg;
              if (res.action === 'removed') {
                d.data.who_like = [];
                msg = '已取消讚';
              } else if (res.action === 'switched') {
                d.data.who_like = [user_id];
                d.data.who_love = [];
                msg = '已改成讚';
              } else {
                msg = '已按讚';
              }

              // 依結果更新訊息（舊的會被清掉）
              showToast(hoverGroup, 0, msg);

              // 面板打開時即時刷新文字
              const panel = thisNode.select('.overlay-info');
              if (!panel.empty()) {
                // 改呼叫面板內的更新器，重畫頭像列
                updateAvatarRows();
              }


              d.data._voting = false;
              if (onRefresh) onRefresh();
            });
          },
          liked,    // 是否已按過 like，控制樣式
          '😀'      // fallback emoji
        );


        // 😍 heart 按鈕
        createIconButton(
          hoverGroup,
          32,  // x 座標偏移，讓按鈕不重疊
          '/img/p1.png',
          function () {
            if (d.data._voting) return;
            d.data._voting = true;

            showToast(hoverGroup, 32, '已表達意見');

            sendVoteToBackend(d.data.t_id, d.data.a_id, user_id, 'heart', (res) => {
              let msg;
              if (res.action === 'removed') {
                d.data.who_love = [];
                msg = '已取消愛心';
              } else if (res.action === 'switched') {
                d.data.who_love = [user_id];
                d.data.who_like = [];
                msg = '已改成愛心';
              } else {
                msg = '已按愛心';
              }

              showToast(hoverGroup, 32, msg);

              const panel = thisNode.select('.overlay-info');
              if (!panel.empty()) {
                updateAvatarRows();   // 重新向 /api/users-info 取圖並重畫頭像列
              }

              d.data._voting = false;
              if (onRefresh) onRefresh();
            });
          },
          loved,   // 是否已按過 heart，控制按鈕樣式
          '😍'     // fallback emoji
        );



        let isEyeOpen = false; // 👁️ 記錄目前是否已開啟 overlay

        // ⬇️ 建立眼睛按鈕（初始強制黑底）
        createIconButton(
          hoverGroup,
          rectWidth - 40,
          'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEidUxRG8FVurhwqDWSGumS2AUFtPOXvNMarEuaMeMZZ-2QvQy1HriKlmhWE-tvJtJmb2dtt5Z-2CsuZWxlkg0skCpOAYTyR_YxSNn2sX-7koaPXUZBWiG2GgK6ZNr5t-qR0zQZqepKoh0I/s800/mark_manpu12_hirameki.png',
          function () {
            const eyeGroup = d3.select(this);
            const existing = thisNode.select('.overlay-info');

            if (!existing.empty()) {
              // 🔴 關閉 overlay
              existing.remove();
              isEyeOpen = false;

              eyeGroup.select('circle')
                .attr('fill', 'black')
                .attr('stroke', '#ddd');
              return;
            }

            // ✅ 開啟底部「意見面板」（固定在底部，不拖曳）
            isEyeOpen = true;

            eyeGroup.select('circle')
              .attr('fill', '#fff')
              .attr('stroke', '#ddd');

            const overlayWidth = rectWidth;
            const PANEL_H = 40;        // 面板本身的高度（你用多少就填多少）
            const panelX  = 0;               // 只做垂直拖曳，X 固定

            // 一般情況
            let panelY = Math.max(0, Math.min(rectHeight - 77, rectHeight - PANEL_H));

            // 如果你的 tile 在 hover 有放大（上方有 const scaleFactor = 1.3），就用它；沒有就設為 1
            const dragScale = (typeof scaleFactor === 'number' && scaleFactor > 0) ? scaleFactor : 1;

            const overlay = thisNode.append('g')
              .attr('class', 'overlay-info')
              .attr('transform', `translate(${panelX}, ${panelY})`)
              .on('mouseenter', e => e.stopPropagation())
              .on('mouseleave', e => e.stopPropagation())
              .call(
                d3.drag().on('drag', function (event) {
                  // 只改 Y，並依縮放做校正，避免放大時拖曳位移過大
                  panelY += event.dy / dragScale;

                  // 夾在格子內
                  const minY = 27;
                  const maxY = rectHeight - 77;
                  if (panelY < minY) panelY = minY;
                  if (panelY > maxY) panelY = maxY;

                  d3.select(this).attr('transform', `translate(${panelX}, ${panelY})`);
                })
              )
              .raise();


            // 底色（半透明黑）
            overlay.append('rect')
              .attr('class', 'overlay-bg')
              .attr('width', overlayWidth)
              .attr('height', PANEL_H)
              .attr('fill','#e5e5e5bb');

            // 👍 圖示 + 容器
            overlay.append('image')
              .attr('class', 'like-icon')
              .attr('href', '/img/oneheart.png')
              .attr('x', 8).attr('y', 6)
              .attr('width', 16).attr('height', 16);

            overlay.append('g')
              .attr('class', 'like-avatars')
              .attr('transform', 'translate(30, 4)');   // 文字位置改成放頭像列

            // ❤️ 圖示 + 容器
            overlay.append('image')
              .attr('class', 'love-icon')
              .attr('href', '/img/p1.png')
              .attr('x', 8).attr('y', 24)
              .attr('width', 16).attr('height', 16);

            overlay.append('g')
              .attr('class', 'love-avatars')
              .attr('transform', 'translate(30, 22)');

            // 把 who_like / who_love 轉成頭像列並渲染到面板
            async function updateAvatarRows() {
              const size = 18, gap = 6;

              const likes = (d.data.who_like || []).map(s => s.toLowerCase());
              const loves = (d.data.who_love || []).map(s => s.toLowerCase());
              const map   = await fetchAvatarsByAccounts([...likes, ...loves]);

              // ---------- 👍 列 ----------
              const likeG = overlay.select('.like-avatars');
              let likeSel = likeG.selectAll('image.avatar').data(likes, acc => acc);
              likeSel.exit().remove();

              const likeEnter = likeSel.enter()
                .append('image')
                .attr('class', 'avatar')
                .attr('y', 0)
                .attr('width', size)
                .attr('height', size)
                .attr('preserveAspectRatio', 'xMidYMid slice');

              likeSel = likeEnter.merge(likeSel);
              likeSel
                .attr('x', (acc, i) => i * (size + gap))
                .attr('href', acc => toImgHref(map[acc] || ''));

              if (likes.length === 0) {
                likeG.selectAll('*').remove();
                likeG.append('text')
                  .attr('x', 0).attr('y', 12)
                  .attr('fill', '#495057')
                  .attr('font-size', 12)
                  .attr('font-weight', 'bold')
                  .text('無');
              }

              // ---------- ❤️ 列 ----------
              const loveG = overlay.select('.love-avatars');
              let loveSel = loveG.selectAll('image.avatar').data(loves, acc => acc);
              loveSel.exit().remove();

              const loveEnter = loveSel.enter()
                .append('image')
                .attr('class', 'avatar')
                .attr('y', 0)
                .attr('width', size)
                .attr('height', size)
                .attr('preserveAspectRatio', 'xMidYMid slice');

              loveSel = loveEnter.merge(loveSel);
              loveSel
                .attr('x', (acc, i) => i * (size + gap))
                .attr('href', acc => toImgHref(map[acc] || ''));

              if (loves.length === 0) {
                loveG.selectAll('*').remove();
                loveG.append('text')
                  .attr('x', 0).attr('y', 12)
                  .attr('fill', '#495057')
                  .attr('font-size', 12)
                  .attr('font-weight', 'bold')
                  .text('無');
              }
            }

            updateAvatarRows();

          },
          false,  // 初始不是 active
          '👁️',   // fallback emoji
          true    // 強制黑底
        );
      })

      nodes.on('mouseleave', function (event, d) {
        if (isDragging) return;

        // 先把自己復原
        const nodeSel = d3.select(this);
        nodeSel.interrupt()
          .attr('transform', `translate(${d.__x},${d.__y}) scale(1)`)
          .style('opacity', 1)
          .selectAll('.hover-buttons,.overlay-info').remove();
        
        nodeSel.select('image').attr('opacity', 0.75);

        // 目的地元素（滑鼠要移到哪）
        const toEl = event.relatedTarget;
        const goingToTile = toEl && toEl.closest && toEl.closest('g.tile');

        // 如果不是移到另一個 tile（可能到空白/右側畫布/外部），就把全部復原
        if (!goingToTile || !ref.current.contains(goingToTile)) {
          nodes.interrupt()
            .style('opacity', 1)
            .attr('transform', n => `translate(${n.__x},${n.__y}) scale(1)`);
          svg.selectAll('.hover-buttons,.overlay-info').remove();
          nodes.select('image').attr('opacity', 0.75);
          activeEl = null;
          activeData = null;
        }
      });

    // 顯示一個 1 秒後自動消失的小提示，掛在 hoverGroup 上
    function showToast(hoverGroup, x, text, stay = 1000) {
      if (!hoverGroup) return;
      hoverGroup.selectAll('.btn-toast').remove();  // 先清掉舊的

      const toast = hoverGroup.append('g')
        .attr('class', 'btn-toast')
        .attr('transform', `translate(${x}, -26)`)
        .style('pointer-events', 'none')
        .attr('opacity', 0);

      const t = toast.append('text')
        .attr('x', 0).attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', 12)
        .attr('fill', '#fff')
        .text(text);

      const b = t.node().getBBox();
      toast.insert('rect', 'text')
        .attr('x', b.x - 6).attr('y', b.y - 3)
        .attr('width', b.width + 12).attr('height', b.height + 6)
        .attr('rx', 6).attr('ry', 6)
        .attr('fill', 'rgba(0,0,0,0.75)');

      toast.transition().duration(120).attr('opacity', 1)
          .transition().delay(stay).duration(250).attr('opacity', 0).remove();
    }




    // 定義一組 SVG <defs> 動態漸層
    const defs = svg.append('defs');

    data.forEach((d, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', 'gradient-border-' + i)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');

      let startColor = '#fae588';
      let endColor = '#f25c54';

      // 根據分類給不同的漸層顏色
      switch (d.category) {
        case 'Culture & Heritage':
          startColor = '#ffdfba';
          endColor = '#ffbf69';
          break;
        case 'Scenic Spots':
          startColor = '#bae1ff';
          endColor = '#baffc9';
          break;
        case 'Transport Rides':
          startColor = '#f9a1bc';
          endColor = '#fbc4ab';
          break;
        case 'Discovery Spaces':
          startColor = '#dcd6f7';
          endColor = '#a6b1e1';
          break;
        case 'Public Squares':
          startColor = '#c77dff';
          endColor = '#ffd6ff';
          break;
        default:
          startColor = '#ddd';
          endColor = '#aaa';
      }

      gradient.selectAll('stop')
        .data([
          { offset: '0%', color: startColor },
          { offset: '100%', color: endColor }
        ])
        .enter()
        .append('stop')
        .attr('offset', d => d.offset)
        .attr('stop-color', d => d.color);
    });


    // 加入動畫函式
    function animateGradient(i) {
      const grad = d3.select(`#gradient-border-${i}`);
      let angle = 0;
      function frame() {
        angle = (angle + 2) % 360;
        grad
          .attr('x2', `${Math.cos(angle * Math.PI / 180) * 100 + 50}%`)
          .attr('y2', `${Math.sin(angle * Math.PI / 180) * 100 + 50}%`);
        requestAnimationFrame(frame);
      }
      frame();
    }

    // 呼叫每個 gradient 的動畫
    data.forEach((d, i) => animateGradient(i));

    function spawnCopy(layer, d, x, y) {
      const g = layer.append('g')
        .attr('class', 'placed-copy')
        .attr('data-aid', d.data.a_id)
        .attr('id', `placed-${d.data.a_id}-${Date.now()}`)
        .attr('transform', `translate(${x},${y})`);

      g.append('image')
        .attr('href', d.data.photo)
        .attr('width', d.__w)
        .attr('height', d.__h)
        .attr('preserveAspectRatio', 'xMidYMid slice')
        .attr('opacity', 0.95)
        .attr('pointer-events', 'none')
        .each(function () {
          this.addEventListener('error', () => {
            d3.select(this).attr('/img/p.png');
          }, { once: true });
        });

      g.append('rect')
        .attr('x', 0).attr('y', 6)
        .attr('width', Math.min(((d.data.name?.length || 0) + 2) * 12 * 0.9, d.__w - 3))
        .attr('height', 16)
        .attr('fill', 'rgba(0,0,0,0.35)')
        .attr('rx', 3).attr('ry', 3)
        .attr('pointer-events', 'none');

      g.append('text')
        .attr('x', 5).attr('y', 18)
        .text(d.data.name)
        .attr('font-size', '12px')
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .attr('pointer-events', 'none');
    }

  }, [data, width, height]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${width}px ${dropW}px`, gap: 16 }}>
      <svg ref={ref} width={width} height={height} />
    </div>
  );
};

/* ---------------------------------------
 * 新增容器：打 API，正規化欄位，丟給 TreemapChart
 * -------------------------------------*/
export default function TreemapChyi() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    axios
      .get('http://localhost:3001/api/attractions')
      .then((res) => {
        // 後端可能只回傳基本欄位，所以在前端補上 treemap 需要的欄位
        const normalized = (Array.isArray(res.data) ? res.data : []).map((d) => ({
          a_id: d.a_id ?? d.id ?? d.aid,
          t_id: d.t_id ?? d.trip_id ?? 1,              // 沒有就先給 1
          name: d.name_zh || d.name || d.name_en || '未命名',
          category: d.category || d.type || 'Unknown',
          photo: d.photo || d.image_url || '',         // 讓 TreemapChart 自己 fallback
          vote_like: Number(d.vote_like ?? 0),
          vote_love: Number(d.vote_love ?? 0),
          who_like: Array.isArray(d.who_like) ? d.who_like : [],
          who_love: Array.isArray(d.who_love) ? d.who_love : [],
        }));
        setData(normalized);
      })
      .catch((e) => {
        console.error('❌ 取 attractions 失敗:', e);
        setErr(e);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 16 }}>載入中…</div>;
  if (err) return <div style={{ padding: 16, color: 'crimson' }}>讀取失敗：{String(err)}</div>;

  return <TreemapChart data={data} width={900} height={520} onRefresh={()=>{}} />;
}