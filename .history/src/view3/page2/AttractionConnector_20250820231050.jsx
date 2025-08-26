import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import './AttractionConnector.css';

const AttractionConnector = ({ schedules = [], containerRef, timeColumnWidth = 0 }) => {
    const svgRef = useRef();
    const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef?.current || schedules.length < 2) {
            return;
        }

        // 延遲執行以確保DOM完全渲染
        const timer = setTimeout(() => {
            drawConnections();
        }, 100);

        // 添加ResizeObserver來監聽DOM變化
        const resizeObserver = new ResizeObserver(() => {
            setTimeout(() => {
                drawConnections();
            }, 50);
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            clearTimeout(timer);
            resizeObserver.disconnect();
        };
    }, [schedules, containerRef, timeColumnWidth, svgDimensions]);

    useEffect(() => {
        // 監聽窗口大小變化
        const handleResize = () => {
            if (containerRef?.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setSvgDimensions({ width: rect.width, height: rect.height });
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [containerRef]);

    const drawConnections = () => {
        if (!containerRef?.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // 清除之前的連線

        const containerRect = containerRef.current.getBoundingClientRect();

        // 設置 SVG 尺寸
        svg
            .attr('width', containerRect.width)
            .attr('height', containerRect.height)
            .style('position', 'absolute')
            .style('top', '0')
            .style('left', '0')
            .style('pointer-events', 'none')
            .style('z-index', '5');

        // 收集所有顯示的景點及其位置信息
        const attractionPositions = [];

        console.log('🔍 AttractionConnector: 開始收集景點位置資訊');
        console.log('📋 Schedules:', schedules);

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
                const attractionRect = attractionEl.getBoundingClientRect();
                const attractionName = attractionEl.querySelector('.attraction_name')?.textContent?.trim();

                console.log(`景點 ${index + 1}: ${attractionName}`);

                if (attractionName) {
                    attractionPositions.push({
                        name: attractionName,
                        scheduleIndex: scheduleIndex,
                        scheduleId: schedule.s_id,
                        x: attractionRect.left - containerRect.left + attractionRect.width / 2,
                        y: attractionRect.top - containerRect.top + attractionRect.height / 2,
                        left: attractionRect.left - containerRect.left,
                        right: attractionRect.right - containerRect.left,
                        top: attractionRect.top - containerRect.top,
                        bottom: attractionRect.bottom - containerRect.top,
                        width: attractionRect.width,
                        height: attractionRect.height
                    });
                }
            });
        });

        console.log('📍 所有景點位置:', attractionPositions);

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
                    console.log(`🔗 連接景點: ${current.scheduleId} -> ${next.scheduleId}`);
                    const paths = calculateConnectionPaths(current, next);
                    paths.forEach(path => {
                        path.attractionName = attractionName; // 添加景點名稱標識
                        attractionPaths.push(path);
                        allPaths.push(path);
                    });
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

            drawConnectionPath(svg, pathData, hasIntersection);
        });
    };

    const calculateConnectionPaths = (from, to) => {
        // 創建右邊整個面的連接
        const padding = 2; // 內縮2px讓連接更圓潤
        const fromX = from.right - padding; // 從右邊界稍微內縮
        const toX = to.left + padding; // 到左邊界稍微內縮

        // 計算整個右側面的上下邊界
        const fromYTop = from.top + padding;
        const fromYBottom = from.bottom - padding;
        const toYTop = to.top + padding;
        const toYBottom = to.bottom - padding;

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
    };    const drawConnectionPath = (svg, pathData, hasIntersection) => {
        const color = hasIntersection ? '#FF4444' : '#2196F3'; // 紅色如果相交，否則藍色

        svg.append('path')
            .attr('d', pathData.path)
            .attr('class', 'attraction-connection')
            .style('fill', 'none')
            .style('stroke', color)
            .style('stroke-width', '2px') // 較細的線條
            .style('stroke-linecap', 'round') // 圓角端點
            .style('stroke-linejoin', 'round') // 圓角連接
            .style('opacity', '0.8')
            .style('transition', 'all 0.3s ease');
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
                width: svgDimensions.width,
                height: svgDimensions.height
            }}
        />
    );
};

export default AttractionConnector;
