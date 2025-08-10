// slider.js
import { useEffect, useRef, useCallback } from 'react';

export function useSlider() {
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const prevRef  = useRef(null);
  const nextRef  = useRef(null);
  const stripRef = useRef(null);
  const wrapRef  = useRef(null);

  // 動態計算單步位移（avatar 寬度 + gap）
  const getStep = useCallback(() => {
    const strip = stripRef.current;
    if (!strip || !strip.firstChild) return 0;
    const avatarWidth = strip.firstChild.offsetWidth;
    const gap = parseFloat(getComputedStyle(strip).gap) || 0;
    return avatarWidth + gap;
  }, []);

  // 根據 newLeft 更新 strip 位置，並同步禁用狀態 + 可選地更新 thumb
  const updatePosition = useCallback((newLeft) => {
    const strip = stripRef.current;
    const wrap  = wrapRef.current;
    if (!strip || !wrap) return;

    // 計算邊界
    const maxLeft = 0;
    const scrollableWidth = strip.scrollWidth - wrap.clientWidth;
    const minLeft = -scrollableWidth;
    const clamped = Math.max(minLeft, Math.min(newLeft, maxLeft));

    strip.style.left = `${clamped}px`;

    // 更新左右按鈕 disabled
    const epsilon = 1;
    if (prevRef.current) prevRef.current.disabled = clamped >= maxLeft - epsilon;
    if (nextRef.current) nextRef.current.disabled = clamped <= minLeft + epsilon;

    // （如果有滑桿）更新 thumb 位置
    const thumb = thumbRef.current;
    const track = trackRef.current;
    if (thumb && track && scrollableWidth > 0) {
      const ratio = clamped / minLeft; // 0 到 1
      const thumbMax = track.clientWidth - thumb.clientWidth;
      thumb.style.left = `${ratio * thumbMax}px`;
    }
  }, []);

  // 拖曳結束後貼齊格
  const snapToGrid = useCallback(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const step = getStep();
    if (step === 0) return;

    const curr = parseFloat(strip.style.left || 0);
    const snapped = Math.round(curr / step) * step;
    strip.style.transition = 'left 0.2s ease';
    updatePosition(snapped);
  }, [getStep, updatePosition]);

  // 左右按鈕點擊
  useEffect(() => {
    const prev = prevRef.current;
    const next = nextRef.current;
    if (!prev || !next) return;

    const handle = (dir) => {
      stripRef.current.style.transition = 'left 0.2s ease';
      const step = getStep();
      const curr = parseFloat(stripRef.current.style.left || 0);
      const idx = Math.round(curr / step);
      updatePosition((idx + dir) * step);
    };

    const goPrev = () => handle(1);
    const goNext = () => handle(-1);

    prev.addEventListener('click', goPrev);
    next.addEventListener('click', goNext);

    // 初始定位
    updatePosition(0);

    return () => {
      prev.removeEventListener('click', goPrev);
      next.removeEventListener('click', goNext);
    };
  }, [getStep, updatePosition]);

  // 拖拽 thumb
  useEffect(() => {
    const thumb = thumbRef.current;
    if (!thumb) return;

    const onMouseDown = (e) => {
      e.preventDefault();
      stripRef.current.style.transition = 'none';
      const startX = e.clientX;
      const startLeft = thumb.offsetLeft;

      const onMouseMove = (me) => {
        const dx = me.clientX - startX;
        const newThumb = startLeft + dx;
        const track = trackRef.current;
        const thumbMax = track ? (track.clientWidth - thumb.clientWidth) : 0;
        const clampedThumb = Math.max(0, Math.min(newThumb, thumbMax || 0));
        // thumb reposition
        thumb.style.left = `${clampedThumb}px`;

        // strip 跟隨
        const wrap = wrapRef.current;
        const scrollW = stripRef.current.scrollWidth - wrap.clientWidth;
        const ratio = thumbMax > 0 ? clampedThumb / thumbMax : 0;
        updatePosition(-ratio * scrollW);
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        snapToGrid();
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    thumb.addEventListener('mousedown', onMouseDown);
    return () => thumb.removeEventListener('mousedown', onMouseDown);
  }, [updatePosition, snapToGrid]);

  return { trackRef, thumbRef, prevRef, nextRef, stripRef, wrapRef };
}
