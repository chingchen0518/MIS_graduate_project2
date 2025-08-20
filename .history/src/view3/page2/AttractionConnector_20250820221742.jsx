import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import './AttractionConnector.css';

const AttractionConnector = ({ schedules = [], containerRef, timeColumnWidth = 0 }) => {
    const svgRef = useRef();

    useEffect(() => {
        if (!containerRef?.current || schedules.length < 2) {
            return;
        }

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
            .style('z-index', '1');

        // 收集所有顯示的景點及其位置信息
        const attractionPositions = [];
        
        schedules.forEach((schedule, scheduleIndex) => {
            const scheduleElement = containerRef.current.querySelector(`[data-schedule-id="${schedule.s_id}"]`);
            if (!scheduleElement) return;

            const scheduleRect = scheduleElement.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            
            // 獲取該行程的所有景點
            const attractionElements = scheduleElement.querySelectorAll('.schedule_item');
            
            attractionElements.forEach((attractionEl) => {
                const attractionRect = attractionEl.getBoundingClientRect();
                const attractionName = attractionEl.querySelector('.attraction_name')?.textContent?.trim();
                
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

        // 按景點名稱分組
        const groupedAttractions = {};
        attractionPositions.forEach(attraction => {
            if (!groupedAttractions[attraction.name]) {
                groupedAttractions[attraction.name] = [];
            }
            groupedAttractions[attraction.name].push(attraction);
        });

        // 為每個有多個實例的景點創建連線
        Object.keys(groupedAttractions).forEach(attractionName => {
            const attractions = groupedAttractions[attractionName];
            if (attractions.length < 2) return;

            // 按行程索引排序
            attractions.sort((a, b) => a.scheduleIndex - b.scheduleIndex);

            // 在相鄰的行程之間創建連線
            for (let i = 0; i < attractions.length - 1; i++) {
                const current = attractions[i];
                const next = attractions[i + 1];

                // 只連接相鄰的行程
                if (next.scheduleIndex - current.scheduleIndex === 1) {
                    drawConnection(svg, current, next);
                }
            }
        });

    }, [schedules, containerRef, timeColumnWidth]);

    const drawConnection = (svg, from, to) => {
        // 計算連接點：從邊框開始，不覆蓋景點名稱
        const fromX = from.right; // 從右邊界開始
        const fromY = from.y; // 中心Y座標
        const toX = to.left; // 到左邊界
        const toY = to.y; // 中心Y座標

        // 如果兩個景點在同一水平線上，直接畫直線
        if (Math.abs(fromY - toY) < 5) {
            svg.append('line')
                .attr('x1', fromX)
                .attr('y1', fromY)
                .attr('x2', toX)
                .attr('y2', toY)
                .attr('class', 'attraction-connection')
                .style('stroke', '#2196F3')
                .style('stroke-width', '2px')
                .style('opacity', '0.7');
        } else {
            // 如果不在同一水平線，使用貝塞爾曲線
            const midX = (fromX + toX) / 2;
            
            const path = d3.path();
            path.moveTo(fromX, fromY);
            path.bezierCurveTo(
                midX, fromY,  // 控制點1
                midX, toY,    // 控制點2
                toX, toY      // 終點
            );
            
            svg.append('path')
                .attr('d', path.toString())
                .attr('class', 'attraction-connection')
                .style('fill', 'none')
                .style('stroke', '#2196F3')
                .style('stroke-width', '2px')
                .style('opacity', '0.7');
        }
    };

    return (
        <svg 
            ref={svgRef}
            className="attraction-connector-svg"
        />
    );
};

export default AttractionConnector;
