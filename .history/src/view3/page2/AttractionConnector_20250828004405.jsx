import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './AttractionConnector.css';

const AttractionConnector = ({ schedules = [], containerRef, timeColumnWidth = 0 }) => {
    const svgRef = useRef();
    const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });
    const [isReady, setIsReady] = useState(false);
    const [hoveredAttraction, setHoveredAttraction] = useState(null);
    const drawTimeoutRef = useRef(null);
    const retryCountRef = useRef(0);

    // 監聽窗口大小變化和容器準備狀態
    useEffect(() => {
        const handleResize = () => {
            if (containerRef?.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setSvgDimensions({ width: rect.width, height: rect.height });
            }
        };

        const checkContainerReady = () => {
            if (containerRef?.current) {
                const scheduleElements = containerRef.current.querySelectorAll('[data-schedule-id]');
                const attractionElements = containerRef.current.querySelectorAll('.schedule_item');

                if (scheduleElements.length > 0 && attractionElements.length > 0) {
                    console.log(`✅ Container ready: ${scheduleElements.length} schedules, ${attractionElements.length} attractions`);
                    setIsReady(true);
                    handleResize();
                } else {
                    console.log(`⏳ Container not ready: ${scheduleElements.length} schedules, ${attractionElements.length} attractions`);
                    setIsReady(false);
                }
            }
        };

        // 初始檢查
        const initialTimer = setTimeout(checkContainerReady, 100);

        // 監聽窗口變化
        window.addEventListener('resize', handleResize);

        // 使用 MutationObserver 監聽 DOM 變化
        const observer = new MutationObserver(() => {
            clearTimeout(drawTimeoutRef.current);
            drawTimeoutRef.current = setTimeout(checkContainerReady, 100);
        });

        if (containerRef?.current) {
            observer.observe(containerRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['data-schedule-id', 'class']
            });
        }

        return () => {
            clearTimeout(initialTimer);
            clearTimeout(drawTimeoutRef.current);
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, [containerRef]);

    // 當準備狀態變化或schedules變化時重新繪製
    useEffect(() => {
        if (!isReady || !containerRef?.current || schedules.length < 2) {
            return;
        }

        retryCountRef.current = 0;
        drawConnectionsWithRetry();
    }, [isReady, schedules, svgDimensions]);

    // 添加滾動和大小變化監聽，確保連線始終跟隨景點
    useEffect(() => {
        if (!containerRef?.current) return;

        const updateConnections = () => {
            if (isReady) {
                console.log('🔄 滾動更新連線位置');
                // 直接重新繪製所有連線
                drawConnectionsWithRetry();
            }
        };

        // 使用節流來提高性能，但確保連線跟隨滾動
        let scrollTimeout;
        const handleScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(updateConnections, 16); // ~60fps
        };

        const handleResize = () => {
            updateConnections();
        };

        // 監聽滾動事件
        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('scroll', handleScroll, { passive: true });

        // 監聽窗口大小變化
        window.addEventListener('resize', handleResize);

        // 監聽容器滾動
        const container = containerRef.current;
        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            clearTimeout(scrollTimeout);
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            container.removeEventListener('scroll', handleScroll);
        };
    }, [isReady]);

    const drawConnectionsWithRetry = () => {
        const maxRetries = 3;

        const attemptDraw = () => {
            console.log(`🎨 繪製連線嘗試 ${retryCountRef.current + 1}/${maxRetries}`);

            const success = drawConnections();

            if (!success && retryCountRef.current < maxRetries - 1) {
                retryCountRef.current++;
                console.log(`🔄 繪製失敗，${500}ms 後重試...`);
                drawTimeoutRef.current = setTimeout(attemptDraw, 500);
            } else if (success) {
                console.log(`✅ 連線繪製成功！`);
                retryCountRef.current = 0;
            } else {
                console.log(`❌ 連線繪製最終失敗，已達最大重試次數`);
            }
        };

        // 清除之前的延時
        clearTimeout(drawTimeoutRef.current);

        // 立即嘗試繪製，不延遲
        attemptDraw();
    };

    const drawConnections = () => {
        if (!containerRef?.current || !svgRef.current) {
            console.log('❌ Container 或 SVG ref 不可用');
            return false;
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // 清除之前的連線

        const containerRect = containerRef.current.getBoundingClientRect();

        // 檢查容器是否有有效尺寸
        if (containerRect.width === 0 || containerRect.height === 0) {
            console.log('❌ Container 尺寸無效');
            return false;
        }

        // 設置 SVG 覆蓋整個視窗（為了定位方便）
        svg
            .attr('width', window.innerWidth)
            .attr('height', window.innerHeight)
            .style('position', 'fixed')
            .style('top', '0')
            .style('left', '0')
            .style('width', window.innerWidth + 'px')
            .style('height', window.innerHeight + 'px')
            .style('pointer-events', 'auto')  // 允許鼠標事件
            .style('z-index', '1000')
            .style('overflow', 'hidden');

        // 添加裁剪路徑，限制在容器範圍內
        const defs = svg.append('defs');
        defs.append('clipPath')
            .attr('id', 'container-clip')
            .append('rect')
            .attr('x', containerRect.left)
            .attr('y', containerRect.top)
            .attr('width', containerRect.width)
            .attr('height', containerRect.height);

        // 創建主要的繪圖群組，應用容器裁剪
        const mainGroup = svg.append('g')
            .attr('clip-path', 'url(#container-clip)');

        console.log('📐 SVG 設置為容器邊界裁剪:', {
            container: {
                left: containerRect.left,
                top: containerRect.top,
                width: containerRect.width,
                height: containerRect.height
            }
        });

        // 返回主要群組供後續繪製使用
        svg.mainGroup = mainGroup;

        // 收集所有顯示的景點及其位置信息
        const attractionPositions = [];

        console.log('🔍 AttractionConnector: 開始收集景點位置資訊');
        console.log('📋 Schedules:', schedules);

        let totalAttractions = 0;

        schedules.forEach((schedule, scheduleIndex) => {
            const scheduleElement = containerRef.current.querySelector(`[data-schedule-id="${schedule.s_id}"]`);
            if (!scheduleElement) {
                console.log(`❌ 找不到 schedule element: ${schedule.s_id}`);
                return;
            }

            console.log(`✅ 找到 schedule element: ${schedule.s_id}`);

            // 獲取該行程的所有景點
            const attractionElements = scheduleElement.querySelectorAll('.schedule_item');
            console.log(`🎯 Schedule ${schedule.s_id} 包含 ${attractionElements.length} 個景點`);

            attractionElements.forEach((attractionEl, index) => {
                // 使用視窗絕對坐標，這樣SVG固定定位時坐標就是正確的
                const attractionRect = attractionEl.getBoundingClientRect();
                const attractionName = attractionEl.querySelector('.attraction_name')?.textContent?.trim();

                console.log(`景點 ${index + 1}: ${attractionName}`, {
                    viewport: {
                        top: attractionRect.top,
                        left: attractionRect.left,
                        bottom: attractionRect.bottom,
                        right: attractionRect.right
                    }
                });

                if (attractionName && attractionRect.width > 0 && attractionRect.height > 0) {
                    // 直接使用視窗坐標，因為SVG是fixed定位
                    attractionPositions.push({
                        name: attractionName,
                        scheduleIndex: scheduleIndex,
                        scheduleId: schedule.s_id,
                        x: attractionRect.left + attractionRect.width / 2,
                        y: attractionRect.top + attractionRect.height / 2,
                        left: attractionRect.left,
                        right: attractionRect.right,
                        top: attractionRect.top,
                        bottom: attractionRect.bottom,
                        width: attractionRect.width,
                        height: attractionRect.height
                    });
                    totalAttractions++;
                }
            });
        });

        console.log('📍 所有景點位置:', attractionPositions);

        // 檢查是否有足夠的景點數據
        if (totalAttractions === 0) {
            console.log('❌ 沒有找到有效的景點數據');
            return false;
        }

        // 按景點名稱分組
        const groupedAttractions = {};
        attractionPositions.forEach(attraction => {
            if (!groupedAttractions[attraction.name]) {
                groupedAttractions[attraction.name] = [];
            }
            groupedAttractions[attraction.name].push(attraction);
        });

        console.log('🔗 分組後的景點:', groupedAttractions);

        // 收集所有將要繪製的線段路徑用於檢測相交
        const allPaths = [];
        const attractionGroups = {}; // 按景點名稱分組路徑

        // 為每個有多個實例的景點創建連線
        Object.keys(groupedAttractions).forEach(attractionName => {
            const attractions = groupedAttractions[attractionName];
            if (attractions.length < 2) return;

            console.log(`🌟 景點 "${attractionName}" 有 ${attractions.length} 個實例，將創建連線`);

            // 按行程索引排序
            attractions.sort((a, b) => a.scheduleIndex - b.scheduleIndex);

            const attractionPaths = [];

            // 在相鄰的行程之間創建連線
            for (let i = 0; i < attractions.length - 1; i++) {
                const current = attractions[i];
                const next = attractions[i + 1];

                // 只連接相鄰的行程
                if (next.scheduleIndex - current.scheduleIndex === 1) {
                    // 檢查是否在可見區域內
                    if (isConnectionVisible(current, next)) {
                        console.log(`🔗 連接景點: ${current.scheduleId} -> ${next.scheduleId}`);
                        const paths = calculateConnectionPaths(current, next);
                        paths.forEach(path => {
                            path.attractionName = attractionName; // 添加景點名稱標識
                            attractionPaths.push(path);
                            allPaths.push(path);
                        });
                    } else {
                        console.log(`👁️ 跳過不可見連線: ${current.scheduleId} -> ${next.scheduleId}`);
                    }
                }
            }

            attractionGroups[attractionName] = attractionPaths;
        });

        // 檢測線段相交並繪製
        allPaths.forEach((pathData, index) => {
            let hasIntersection = false;

            // 檢查與其他**不同景點**的路徑是否相交
            for (let j = 0; j < allPaths.length; j++) {
                if (j !== index &&
                    pathData.attractionName !== allPaths[j].attractionName && // 必須是不同景點的線
                    pathsIntersect(pathData, allPaths[j])) {
                    hasIntersection = true;
                    break;
                }
            }

            drawConnectionPath(svg, pathData, hasIntersection, hoveredAttraction);
        });

        console.log('✅ 所有連線繪製完成');
        return true; // 成功繪製
    };

    const isConnectionVisible = (from, to) => {
        // 使用 ScheduleContainer 的邊界
        if (!containerRef?.current) return false;

        const containerRect = containerRef.current.getBoundingClientRect();

        // 檢查景點是否與容器有任何重疊（只要有一點在容器內就算可見）
        const isAttractionVisible = (attraction) => {
            return !(attraction.right < containerRect.left ||
                attraction.left > containerRect.right ||
                attraction.bottom < containerRect.top ||
                attraction.top > containerRect.bottom);
        };

        const fromVisible = isAttractionVisible(from);
        const toVisible = isAttractionVisible(to);

        // 只要其中一個景點有任何部分在容器內就顯示連線
        const anyVisible = fromVisible || toVisible;

        console.log(`👁️ 容器重疊檢查: ${from.name} -> ${to.name}`, {
            fromVisible,
            toVisible,
            anyVisible,
            container: {
                left: containerRect.left,
                right: containerRect.right,
                top: containerRect.top,
                bottom: containerRect.bottom
            },
            from: { left: from.left, right: from.right, top: from.top, bottom: from.bottom },
            to: { left: to.left, right: to.right, top: to.top, bottom: to.bottom }
        });

        return anyVisible;
    };

    const calculateConnectionPaths = (from, to) => {
        // 獲取容器邊界而不是視窗邊界
        if (!containerRef?.current) return [];

        const containerRect = containerRef.current.getBoundingClientRect();

        // 創建右邊整個面的連接
        const padding = 2; // 內縮2px讓連接更圓潤
        let fromX = from.right - padding; // 從右邊界稍微內縮
        let toX = to.left + padding; // 到左邊界稍微內縮

        // 限制X坐標在容器範圍內
        fromX = Math.max(containerRect.left, Math.min(fromX, containerRect.right));
        toX = Math.max(containerRect.left, Math.min(toX, containerRect.right));

        // 計算整個右側面的上下邊界，並限制在容器範圍內
        let fromYTop = Math.max(containerRect.top, from.top + padding);
        let fromYBottom = Math.min(containerRect.bottom, from.bottom - padding);
        let toYTop = Math.max(containerRect.top, to.top + padding);
        let toYBottom = Math.min(containerRect.bottom, to.bottom - padding);

        // 確保Y座標有效
        if (fromYBottom <= fromYTop) fromYBottom = fromYTop + 1;
        if (toYBottom <= toYTop) toYBottom = toYTop + 1;

        console.log(`📏 容器邊界路徑限制:`, {
            original: { fromX: from.right - padding, toX: to.left + padding },
            limited: { fromX, toX },
            container: {
                left: containerRect.left,
                right: containerRect.right,
                top: containerRect.top,
                bottom: containerRect.bottom
            }
        });

        // 返回一個表示整個右側面連接的路徑
        return [
            {
                type: 'surface',
                fromX,
                fromYTop,
                fromYBottom,
                toX,
                toYTop,
                toYBottom,
                // 創建一個多邊形路徑表示整個面的連接
                path: createSurfacePath(fromX, fromYTop, fromYBottom, toX, toYTop, toYBottom)
            }
        ];
    };

    const createSurfacePath = (fromX, fromYTop, fromYBottom, toX, toYTop, toYBottom) => {
        // 創建一個表示整個右側面連接的多邊形路徑
        const path = d3.path();

        // 起始點（右側面的頂部）
        path.moveTo(fromX, fromYTop);

        // 連到目標的頂部
        path.lineTo(toX, toYTop);

        // 連到目標的底部
        path.lineTo(toX, toYBottom);

        // 連到起始點的底部
        path.lineTo(fromX, fromYBottom);

        // 閉合路徑
        path.closePath();

        return path.toString();
    };

    // 面與面相交檢測
    const pathsIntersect = (path1, path2) => {
        // 如果是同一景點的面，不算相交
        if (path1.attractionName === path2.attractionName) {
            return false;
        }

        // 檢測兩個面的邊界框是否重疊
        return surfacesIntersect(path1, path2);
    };

    const surfacesIntersect = (surface1, surface2) => {
        // 計算每個面的邊界
        const bounds1 = {
            left: Math.min(surface1.fromX, surface1.toX),
            right: Math.max(surface1.fromX, surface1.toX),
            top: Math.min(surface1.fromYTop, surface1.toYTop),
            bottom: Math.max(surface1.fromYBottom, surface1.toYBottom)
        };

        const bounds2 = {
            left: Math.min(surface2.fromX, surface2.toX),
            right: Math.max(surface2.fromX, surface2.toX),
            top: Math.min(surface2.fromYTop, surface2.toYTop),
            bottom: Math.max(surface2.fromYBottom, surface2.toYBottom)
        };

        // 檢測兩個矩形是否重疊
        return !(bounds1.right < bounds2.left ||
            bounds2.right < bounds1.left ||
            bounds1.bottom < bounds2.top ||
            bounds2.bottom < bounds1.top);
    };

    const drawConnectionPath = (svg, pathData, hasIntersection, hoveredAttraction) => {
        const baseColor = hasIntersection ? '#FF4444' : '#2196F3'; // 紅色如果相交，否則藍色
        
        // 根據懸停狀態決定透明度
        let opacity = 0.3;
        let strokeOpacity = 0.8;
        
        if (hoveredAttraction !== null) {
            if (pathData.attractionName === hoveredAttraction) {
                // 被懸停的景點線條發亮
                opacity = 0.7;
                strokeOpacity = 1.0;
            } else {
                // 其他線條黯淡
                opacity = 0.1;
                strokeOpacity = 0.3;
            }
        }

        // 使用主要群組繪製，自動應用裁剪
        const targetGroup = svg.mainGroup || svg;

        const path = targetGroup.append('path')
            .attr('d', pathData.path)
            .attr('class', 'attraction-connection')
            .attr('data-attraction-name', pathData.attractionName)
            .style('fill', baseColor) // 使用填充而不是描邊
            .style('fill-opacity', opacity) // 透明的填充
            .style('stroke', baseColor) // 邊框同色
            .style('stroke-width', '1px') // 細邊框
            .style('stroke-opacity', strokeOpacity) // 邊框稍微不透明
            .style('cursor', 'pointer')
            .style('transition', 'all 0.2s ease'); // 平滑過渡效果
            
        // 添加鼠標事件
        path
            .on('mouseenter', function() {
                setHoveredAttraction(pathData.attractionName);
            })
            .on('mouseleave', function() {
                setHoveredAttraction(null);
            });
    };

    const drawConnection = (svg, from, to) => {
        // 這個函數保留作為備用，現在主要使用上面的新函數
        const paths = calculateConnectionPaths(from, to);
        paths.forEach(pathData => {
            drawConnectionPath(svg, pathData, false);
        });
    };

    return (
        <svg
            ref={svgRef}
            className="attraction-connector-svg"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 1000,
                overflow: 'visible'
            }}
        />
    );
};

export default AttractionConnector;
