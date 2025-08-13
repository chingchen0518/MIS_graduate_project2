import React, { useState, useEffect } from 'react';
import './Filter.css';

const Filter = ({ onFilterChange }) => {
    const [filters, setFilters] = useState({
        priceRange: [0, 650],
        participants: '',
        categories: []
    });
    
    const [categories, setCategories] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);

    // 從 API 獲取所有類別
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('http://localhost:3001/api/attraction_categories');
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error('獲取類別失敗:', error);
            }
        };

        fetchCategories();
    }, []);

    // 當篩選條件改變時通知父組件
    useEffect(() => {
        if (onFilterChange) {
            onFilterChange(filters);
        }
    }, [filters, onFilterChange]);

    // 處理價格範圍變化
    const handlePriceChange = (index, value) => {
        const newPriceRange = [...filters.priceRange];
        newPriceRange[index] = parseInt(value);
        setFilters(prev => ({
            ...prev,
            priceRange: newPriceRange
        }));
    };

    // 處理參與者變化
    const handleParticipantsChange = (participants) => {
        setFilters(prev => ({
            ...prev,
            participants
        }));
    };

    // 處理類別選擇
    const handleCategoryToggle = (category) => {
        setFilters(prev => ({
            ...prev,
            categories: prev.categories.includes(category)
                ? prev.categories.filter(c => c !== category)
                : [...prev.categories, category]
        }));
    };

    // 清除所有篩選
    const clearAllFilters = () => {
        setFilters({
            priceRange: [0, 650],
            participants: '',
            categories: []
        });
    };

    return (
        <div className="filter-container">
            <div className="filter-header" onClick={() => setIsExpanded(!isExpanded)}>
                <span className="filter-icon">🔍</span>
                <span className="filter-title">篩選</span>
                <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
            </div>

            {isExpanded && (
                <div className="filter-content">
                    {/* 價格範圍 */}
                    <div className="filter-section">
                        <div className="filter-label">
                            <span>💰</span>
                            <span>價格範圍</span>
                        </div>
                        <div className="price-range">
                            <input
                                type="number"
                                value={filters.priceRange[0]}
                                onChange={(e) => handlePriceChange(0, e.target.value)}
                                min="0"
                                max="650"
                                className="price-input"
                            />
                            <div className="price-slider-container">
                                <input
                                    type="range"
                                    min="0"
                                    max="650"
                                    value={filters.priceRange[0]}
                                    onChange={(e) => handlePriceChange(0, e.target.value)}
                                    className="price-slider price-slider-min"
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max="650"
                                    value={filters.priceRange[1]}
                                    onChange={(e) => handlePriceChange(1, e.target.value)}
                                    className="price-slider price-slider-max"
                                />
                            </div>
                            <input
                                type="number"
                                value={filters.priceRange[1]}
                                onChange={(e) => handlePriceChange(1, e.target.value)}
                                min="0"
                                max="650"
                                className="price-input"
                            />
                        </div>
                    </div>

                    {/* 參與者 */}
                    <div className="filter-section">
                        <div className="filter-label">
                            <span>👥</span>
                            <span>參與者</span>
                        </div>
                        <div className="participants-options">
                            {['個人', '情侶', '家庭', '朋友'].map((option) => (
                                <button
                                    key={option}
                                    className={`participant-btn ${filters.participants === option ? 'active' : ''}`}
                                    onClick={() => handleParticipantsChange(filters.participants === option ? '' : option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 類別 */}
                    <div className="filter-section">
                        <div className="filter-label">
                            <span>🏷️</span>
                            <span>類別</span>
                        </div>
                        <div className="categories-grid">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    className={`category-btn ${filters.categories.includes(category) ? 'active' : ''}`}
                                    onClick={() => handleCategoryToggle(category)}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 清除按鈕 */}
                    <div className="filter-actions">
                        <button className="clear-btn" onClick={clearAllFilters}>
                            清除所有篩選
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Filter;
