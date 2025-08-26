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
        // 計算連接點：從邊框開始，不覆蓋景點名稱
        const fromX = from.right; // 從右邊界開始
        const fromY = from.y; // 中心Y座標
        const toX = to.left; // 到左邊界
        const toY = to.y; // 中心Y座標

        // 計算弧形曲線的控制點
        const horizontalDistance = toX - fromX;
        const verticalDistance = toY - fromY;
        
        // 設置弧形的曲率，距離越遠弧度越大
        const curvature = Math.max(horizontalDistance * 0.3, 30); // 最小弧度為30px
        
        // 計算控制點位置
        const controlX1 = fromX + curvature;
        const controlY1 = fromY;
        const controlX2 = toX - curvature;
        const controlY2 = toY;
        
        // 創建弧形路徑
        const path = d3.path();
        path.moveTo(fromX, fromY);
        path.bezierCurveTo(
            controlX1, controlY1,  // 第一個控制點
            controlX2, controlY2,  // 第二個控制點
            toX, toY               // 終點
        );
        
        svg.append('path')
            .attr('d', path.toString())
            .attr('class', 'attraction-connection')
            .style('fill', 'none')
            .style('stroke', '#FF6B35')  // 改為橘色，類似圖片中的顏色
            .style('stroke-width', '3px') // 稍微加粗
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
