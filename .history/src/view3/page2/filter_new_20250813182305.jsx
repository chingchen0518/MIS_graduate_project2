import React, { useState, useEffect } from 'react';
import './Filter.css';

const Filter = ({ onFilterChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [categories, setCategories] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedCities, setSelectedCities] = useState([]);
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [expandedSections, setExpandedSections] = useState({
        category: false,
        city: false,
        price: false
    });

    // 載入類別和城市資料
    useEffect(() => {
        // 獲取景點類別
        fetch('http://localhost:5000/api/attraction-categories')
            .then(response => response.json())
            .then(data => {
                setCategories(data);
            })
            .catch(error => {
                console.error('獲取景點類別失敗:', error);
            });

        // 獲取城市資料
        fetch('http://localhost:5000/api/attraction-cities')
            .then(response => response.json())
            .then(data => {
                setCities(data);
            })
            .catch(error => {
                console.error('獲取城市資料失敗:', error);
            });
    }, []);

    // 當篩選條件改變時通知父組件
    useEffect(() => {
        const filterData = {
            categories: selectedCategories,
            cities: selectedCities,
            priceRange: priceRange
        };
        onFilterChange && onFilterChange(filterData);
    }, [selectedCategories, selectedCities, priceRange, onFilterChange]);

    // 處理類別選擇
    const handleCategoryChange = (category) => {
        setSelectedCategories(prev => {
            const newSelected = prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category];
            return newSelected;
        });
    };

    // 處理城市選擇
    const handleCityChange = (city) => {
        setSelectedCities(prev => {
            const newSelected = prev.includes(city)
                ? prev.filter(c => c !== city)
                : [...prev, city];
            return newSelected;
        });
    };

    // 處理價格範圍變更
    const handlePriceChange = (e) => {
        const value = parseInt(e.target.value);
        setPriceRange([0, value]);
    };

    // 切換展開狀態
    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    // 切換子區塊展開狀態
    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // 清除所有篩選
    const clearFilters = () => {
        setSelectedCategories([]);
        setSelectedCities([]);
        setPriceRange([0, 1000]);
    };

    return (
        <div className="filter-container">
            <div className="filter-header" onClick={toggleExpanded}>
                <span className="filter-icon">🔍</span>
                <span className="filter-title">篩選:</span>
                <div className="filter-summary">
                    {selectedCategories.length > 0 && (
                        <span className="summary-item">類別: {selectedCategories.length}</span>
                    )}
                    {selectedCities.length > 0 && (
                        <span className="summary-item">城市: {selectedCities.length}</span>
                    )}
                </div>
                <div className="price-range-display">
                    <span>💰</span>
                    <input
                        type="range"
                        min="0"
                        max="1000"
                        value={priceRange[1]}
                        onChange={handlePriceChange}
                        className="price-slider"
                    />
                    <span className="price-value">{priceRange[1]}</span>
                </div>
                <span className="expand-arrow">{isExpanded ? '▲' : '▼'}</span>
            </div>

            {isExpanded && (
                <div className="filter-content">
                    <div className="filter-actions">
                        <button className="clear-button" onClick={clearFilters}>
                            清除
                        </button>
                    </div>

                    {/* 類別篩選 */}
                    <div className="filter-section">
                        <div 
                            className="section-header" 
                            onClick={() => toggleSection('category')}
                        >
                            <span>類別</span>
                            <span className="section-arrow">
                                {expandedSections.category ? '▲' : '▼'}
                            </span>
                        </div>
                        {expandedSections.category && (
                            <div className="category-grid">
                                {categories.map(category => (
                                    <div
                                        key={category}
                                        className={`category-item ${selectedCategories.includes(category) ? 'selected' : ''}`}
                                        onClick={() => handleCategoryChange(category)}
                                    >
                                        {category}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 城市篩選 */}
                    <div className="filter-section">
                        <div 
                            className="section-header" 
                            onClick={() => toggleSection('city')}
                        >
                            <span>城市</span>
                            <span className="section-arrow">
                                {expandedSections.city ? '▲' : '▼'}
                            </span>
                        </div>
                        {expandedSections.city && (
                            <div className="city-grid">
                                {cities.map(city => (
                                    <div
                                        key={city}
                                        className={`city-item ${selectedCities.includes(city) ? 'selected' : ''}`}
                                        onClick={() => handleCityChange(city)}
                                    >
                                        {city}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 價格範圍篩選 */}
                    <div className="filter-section">
                        <div 
                            className="section-header" 
                            onClick={() => toggleSection('price')}
                        >
                            <span>預算</span>
                            <span className="section-arrow">
                                {expandedSections.price ? '▲' : '▼'}
                            </span>
                        </div>
                        {expandedSections.price && (
                            <div className="price-section">
                                <div className="price-range">
                                    <label>價格範圍: NT$ 0 - {priceRange[1]}</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1000"
                                        value={priceRange[1]}
                                        onChange={handlePriceChange}
                                        className="price-range-slider"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Filter;
