import React, { useEffect, useRef, useState } from 'react';
import './TimePickerWheel.css';

const generateRange = (max) => Array.from({ length: max }, (_, i) => i);

const ScrollPicker = ({ values, selected, onChange }) => {
    const listRef = useRef(null);
    const timeoutRef = useRef(null);
    const scrollingRef = useRef(false); // 加入滾動鎖定旗標

    const itemHeight = 40;
    const visibleCount = 5;
    const paddingCount = 2;

    const paddedValues = [
        ...Array(paddingCount).fill(null),
        ...values,
        ...Array(paddingCount).fill(null),
    ];

    useEffect(() => {
        if (listRef.current) {
            const index = values.indexOf(selected);
            const targetScrollTop =
                (index + paddingCount) * itemHeight - itemHeight * Math.floor(visibleCount / 2);
            const maxScrollTop = (paddedValues.length - 1) * itemHeight;
            const clampedScrollTop = Math.min(Math.max(targetScrollTop, 0), maxScrollTop);

            // 如果差異大才滾動，並且啟動滾動鎖定，避免觸發 onChange
            if (Math.abs(listRef.current.scrollTop - clampedScrollTop) > 1) {
                scrollingRef.current = true;
                listRef.current.scrollTop = clampedScrollTop;

                // 200ms 後解鎖
                setTimeout(() => {
                    scrollingRef.current = false;
                }, 200);
            }
        }
    }, [selected, values]);

    const handleScroll = () => {
        if (scrollingRef.current) return;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            const scrollTop = listRef.current.scrollTop;
            const maxScrollTop = listRef.current.scrollHeight - listRef.current.clientHeight;

            // 判斷是否滑到頂端（容差 5px）
            if (scrollTop <= 5) {
                const firstValue = values[0];
                if (firstValue !== selected) {
                    onChange(firstValue);
                }
                return;
            }

            // 判斷是否滑到底（容差 5px）
            if (scrollTop >= maxScrollTop - 5) {
                const lastValue = values[values.length - 1];
                if (lastValue !== selected) {
                    onChange(lastValue);
                }
                return;
            }

            const centerIndex = Math.round((scrollTop + (itemHeight * visibleCount) / 2) / itemHeight);
            const clampedIndex = Math.min(Math.max(centerIndex, 0), paddedValues.length - 1);

            const valueIndex = clampedIndex - paddingCount;
            if (valueIndex >= 0 && valueIndex < values.length) {
                const val = values[valueIndex];
                if (val !== selected) {
                    onChange(val);
                }
            }
        }, 100);
    };



    return (
        <div className="scroll-picker">
            <div className="scroll-mask" />
            <div
                className="scroll-list"
                ref={listRef}
                onScroll={handleScroll}
                style={{ maxHeight: `${itemHeight * visibleCount}px` }}
            >
                {paddedValues.map((val, idx) => (
                    <div
                        key={idx}
                        className={`scroll-item ${val === selected ? 'selected' : ''} ${val === null ? 'empty' : ''
                            }`}
                        style={{ height: `${itemHeight}px` }}
                    >
                        {val === null ? '' : val.toString().padStart(2, '0')}
                    </div>
                ))}
            </div>
        </div>
    );
};

const TimePickerWheel = () => {
    const [hour, setHour] = useState(0);
    const [minute, setMinute] = useState(0);
    const [second, setSecond] = useState(0);

    return (
        <div className="wheel-container">
            <h2>滾輪時間選擇器</h2>
            <div className="wheel-pickers">
                <ScrollPicker values={generateRange(24)} selected={hour} onChange={setHour} />
                <span>:</span>
                <ScrollPicker values={generateRange(60)} selected={minute} onChange={setMinute} />
                <span>:</span>
                <ScrollPicker values={generateRange(60)} selected={second} onChange={setSecond} />
            </div>
            <div className="selected-time">
                選擇時間：{hour.toString().padStart(2, '0')}:
                {minute.toString().padStart(2, '0')}:
                {second.toString().padStart(2, '0')}
            </div>
        </div>
    );
};

export default TimePickerWheel;
