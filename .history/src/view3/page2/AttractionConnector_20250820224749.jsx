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

        // 為每個有多個實例的景點創建連線
        Object.keys(groupedAttractions).forEach(attractionName => {
            const attractions = groupedAttractions[attractionName];
            if (attractions.length < 2) return;

            console.log(`🌟 景點 "${attractionName}" 有 ${attractions.length} 個實例，將創建連線`);

            // 按行程索引排序
            attractions.sort((a, b) => a.scheduleIndex - b.scheduleIndex);

            // 在相鄰的行程之間創建連線
            for (let i = 0; i < attractions.length - 1; i++) {
                const current = attractions[i];
                const next = attractions[i + 1];

                // 只連接相鄰的行程
                if (next.scheduleIndex - current.scheduleIndex === 1) {
                    console.log(`🔗 連接景點: ${current.scheduleId} -> ${next.scheduleId}`);
                    const paths = calculateConnectionPaths(current, next);
                    allPaths.push(...paths);
                }
            }
        });

        // 檢測線段相交並繪製
        allPaths.forEach((pathData, index) => {
            let hasIntersection = false;
            
            // 檢查與其他路徑是否相交
            for (let j = 0; j < allPaths.length; j++) {
                if (j !== index && pathsIntersect(pathData, allPaths[j])) {
                    hasIntersection = true;
                    break;
                }
            }
            
            drawConnectionPath(svg, pathData, hasIntersection);
        });
    };

    const calculateConnectionPaths = (from, to) => {
        // 計算連接點：從景點的上下邊緣連接
        const fromX = from.right; // 從右邊界開始
        const toX = to.left; // 到左邊界
        
        // 上方連線：從起點最上方直接連到終點最上方
        const fromYTop = from.top; // 0% - 最頂部
        const toYTop = to.top; // 0% - 最頂部
        
        // 下方連線：從起點最下方直接連到終點最下方
        const fromYBottom = from.bottom; // 0% - 最底部
        const toYBottom = to.bottom; // 0% - 最底部
        
        // 返回上下兩條直線路徑
        return [
            {
                type: 'top',
                fromX, fromY: fromYTop, toX, toY: toYTop,
                path: createStraightPath(fromX, fromYTop, toX, toYTop)
            },
            {
                type: 'bottom', 
                fromX, fromY: fromYBottom, toX, toY: toYBottom,
                path: createStraightPath(fromX, fromYBottom, toX, toYBottom)
            }
        ];
    };

    const createStraightPath = (fromX, fromY, toX, toY) => {
        // 創建直線路徑
        const path = d3.path();
        path.moveTo(fromX, fromY);
        path.lineTo(toX, toY);
        return path.toString();
    };

    // 簡化的路徑相交檢測
    const pathsIntersect = (path1, path2) => {
        // 檢查兩個路徑的邊界框是否重疊
        const bbox1 = getPathBoundingBox(path1);
        const bbox2 = getPathBoundingBox(path2);
        
        return !(bbox1.right < bbox2.left || 
                bbox2.right < bbox1.left || 
                bbox1.bottom < bbox2.top || 
                bbox2.bottom < bbox1.top);
    };

    const getPathBoundingBox = (pathData) => {
        return {
            left: Math.min(pathData.fromX, pathData.toX),
            right: Math.max(pathData.fromX, pathData.toX),
            top: Math.min(pathData.fromY, pathData.toY),
            bottom: Math.max(pathData.fromY, pathData.toY)
        };
    };

    const drawConnectionPath = (svg, pathData, hasIntersection) => {
        const color = hasIntersection ? '#FF4444' : '#FF6B35'; // 紅色如果相交，否則橘色
        
        svg.append('path')
            .attr('d', pathData.path)
            .attr('class', 'attraction-connection')
            .style('fill', 'none')
            .style('stroke', color)
            .style('stroke-width', '2px')
            .style('opacity', '0.8');
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
