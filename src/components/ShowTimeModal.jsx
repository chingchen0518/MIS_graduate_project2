import React, { useEffect, useRef, useState } from 'react';
import './ShowTimeModal.css';

// 時間滾輪元件
const generateRange = (max) => Array.from({ length: max }, (_, i) => i);

const ScrollPicker = ({ values, selected, onChange }) => {
    const listRef = useRef(null);
    const timeoutRef = useRef(null);
    const scrollingRef = useRef(false);

    const itemHeight = 40;
    const visibleCount = 3;
    const paddingCount = 1;

    const paddedValues = [
        ...Array(paddingCount).fill(null),
        ...values,
        ...Array(paddingCount).fill(null),
    ];

    // 點擊選擇
    const handleItemClick = (val) => {
        if (val !== null && val !== selected) {
            onChange(val);
        }
    };

    useEffect(() => {
        if (listRef.current) {
            const index = values.indexOf(selected);
            const targetScrollTop =
                (index + paddingCount) * itemHeight - itemHeight * Math.floor(visibleCount / 2);
            const maxScrollTop = (paddedValues.length - 1) * itemHeight;
            const clampedScrollTop = Math.min(Math.max(targetScrollTop, 0), maxScrollTop);

            if (Math.abs(listRef.current.scrollTop - clampedScrollTop) > 1) {
                scrollingRef.current = true;
                listRef.current.scrollTop = clampedScrollTop;
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

            if (scrollTop <= 3) {
                const firstValue = values[0];
                if (firstValue !== selected) {
                    onChange(firstValue);
                }
                return;
            }

            if (scrollTop >= maxScrollTop - 3) {
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
        <div className="scroll-picker" style={{ userSelect: 'none', cursor: 'pointer' }}>
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
                        className={`scroll-item ${val === selected ? 'selected' : ''} ${val === null ? 'empty' : ''}`}
                        style={{ height: `${itemHeight}px` }}
                        onClick={() => handleItemClick(val)}
                    >
                        {val === null ? '' : val.toString().padStart(2, '0')}
                    </div>
                ))}
            </div>
        </div>
    );
};

const TimePickerWheel = ({ time, onChange }) => {
    let initialHour = 0, initialMinute = 0, initialSecond = 0;
    if (typeof time === 'string') {
        const parts = time.split(':');
        if (parts.length === 3) {
            initialHour = parseInt(parts[0], 10) || 0;
            initialMinute = parseInt(parts[1], 10) || 0;
            initialSecond = parseInt(parts[2], 10) || 0;
        }
    }
    const [hour, setHour] = useState(initialHour);
    const [minute, setMinute] = useState(initialMinute);
    const [second, setSecond] = useState(initialSecond);
    const selectedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;

    // 當時間有變動時通知父元件
    useEffect(() => {
        if (onChange) {
            onChange(selectedTime);
        }
    }, [hour, minute, second, onChange, selectedTime]);

    return (
        <div className="wheel-container">
            <div className="wheel-pickers">
                <ScrollPicker values={generateRange(24)} selected={hour} onChange={setHour} />
                <span>:</span>
                <ScrollPicker values={generateRange(60)} selected={minute} onChange={setMinute} />
                <span>:</span>
                <ScrollPicker values={generateRange(60)} selected={second} onChange={setSecond} />
            </div>
        </div>
    );
};

function ShowTimeModal({ tripId, deadline, time, stage_date, onClose }) {
    const [selectedTime, setSelectedTime] = useState(time);
    useEffect(() => {
        setSelectedTime(time);
    }, [time]);

    // 計算新的 deadline
    let deadlineStr = '未設定';
    if (stage_date && selectedTime) {
        const [datePart, timePart] = stage_date.split(' ');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);
        const [addH, addM, addS] = selectedTime.split(':').map(Number);

        const deadlineDate = new Date(year, month - 1, day, hour, minute, second);
        deadlineDate.setHours(deadlineDate.getHours() + addH);
        deadlineDate.setMinutes(deadlineDate.getMinutes() + addM);
        deadlineDate.setSeconds(deadlineDate.getSeconds() + addS);

        const two = n => (n < 10 ? '0' + n : n);
        deadlineStr = `${deadlineDate.getFullYear()}-${two(deadlineDate.getMonth() + 1)}-${two(deadlineDate.getDate())} ${two(deadlineDate.getHours())}:${two(deadlineDate.getMinutes())}:${two(deadlineDate.getSeconds())}`;
    }
    // 儲存按鈕事件
    const handleSave = async () => {
        try {
            await fetch('/api/update-trip-time', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    t_id: tripId,
                    time: selectedTime
                })
            });
            alert('Update successful');
            if (onClose) onClose(true);
        } catch (err) {
            alert('Update failed');
        }
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h3>Adjust Duration</h3>
                <p>Current Stage Start Time:<br />{stage_date ? stage_date : 'Not Set'}</p>
                <p>Set Stage Duration:</p>
                <TimePickerWheel time={time} onChange={setSelectedTime} />
                <p>Calculated Deadline:<br />{deadlineStr}</p>
                <div className="time-modal-buttons">
                    <button onClick={onClose}>Close</button>
                    <button onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
}

export default ShowTimeModal;