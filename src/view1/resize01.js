import { useRef, useEffect } from 'react';

export function useResizer(minWidth = 20, maxWidth = 280, collapseWidth = 30) {
  const sidebarRef = useRef(null);
  const resizerRef = useRef(null);

  useEffect(() => {
    const sidebar  = sidebarRef.current;
    const resizer  = resizerRef.current;
    if (!sidebar || !resizer) return;

    /* -------- 初始狀態 -------- */
    sidebar.style.width = `${maxWidth}px`;     // 初始展開
    sidebar.classList.remove('collapsed');     // 先顯示內容

    let isResizing = false;

    const onMouseDown = e => {
      isResizing = true;
      document.body.style.cursor = 'ew-resize';
      e.preventDefault();
    };

    const onMouseMove = e => {
      if (!isResizing) return;

      /* -------- 重新計算寬度 -------- */
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      sidebar.style.width = `${newWidth}px`;

      /* -------- 只有 < collapseWidth 才藏內容 -------- */
      sidebar.classList.toggle('collapsed', newWidth < collapseWidth);
    };

    const onMouseUp = () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
      }
    };

    resizer.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      resizer.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [minWidth, maxWidth, collapseWidth]);

  return { sidebarRef, resizerRef };
}

