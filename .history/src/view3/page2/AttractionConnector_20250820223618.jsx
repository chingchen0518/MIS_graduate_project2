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
                    drawConnection(svg, current, next);
                }
            }
        });
    };

    const drawConnection = (svg, from, to) => {
        // 計算連接點：從景點的上下邊緣連接
        const fromX = from.right; // 從右邊界開始
        const toX = to.left; // 到左邊界
        
        // 計算上下連接點的Y座標，增加偏移量讓線條更分散
        const offsetY = from.height * 0.4; // 從0.25增加到0.4，讓線條更分散
        
        // 上方連線的起點和終點 - 更靠近頂部
        const fromYTop = from.top + offsetY * 0.3; // 更接近頂部
        const toYTop = to.top + offsetY * 0.3;
        
        // 下方連線的起點和終點 - 更靠近底部
        const fromYBottom = from.bottom - offsetY * 0.3; // 更接近底部
        const toYBottom = to.bottom - offsetY * 0.3;
        
        // 計算弧形曲線的控制點
        const horizontalDistance = toX - fromX;
        const curvature = Math.max(horizontalDistance * 0.3, 30); // 最小弧度為30px
        
        // 繪製上方弧線
        const pathTop = d3.path();
        pathTop.moveTo(fromX, fromYTop);
        pathTop.bezierCurveTo(
            fromX + curvature, fromYTop,    // 第一個控制點
            toX - curvature, toYTop,        // 第二個控制點
            toX, toYTop                     // 終點
        );
        
        svg.append('path')
            .attr('d', pathTop.toString())
            .attr('class', 'attraction-connection')
            .style('fill', 'none')
            .style('stroke', '#FF6B35')
            .style('stroke-width', '2px')  // 稍微細一點因為有兩條線
            .style('opacity', '0.8');
        
        // 繪製下方弧線
        const pathBottom = d3.path();
        pathBottom.moveTo(fromX, fromYBottom);
        pathBottom.bezierCurveTo(
            fromX + curvature, fromYBottom,  // 第一個控制點
            toX - curvature, toYBottom,      // 第二個控制點
            toX, toYBottom                   // 終點
        );
        
        svg.append('path')
            .attr('d', pathBottom.toString())
            .attr('class', 'attraction-connection')
            .style('fill', 'none')
            .style('stroke', '#FF6B35')
            .style('stroke-width', '2px')  // 稍微細一點因為有兩條線
            .style('opacity', '0.8');
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
