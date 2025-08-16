import React, { useState, useEffect } from 'react';
import './Filter.css';

const Filter = ({ t_id, onCategoryChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [costRange, setCostRange] = useState([0, 650]);
    const [loading, setLoading] = useState(true);

    // 從資料庫獲取該trip的所有類別
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:3001/api/view3_trip_categories/${t_id}`);
                const data = await response.json();
                
                if (data.success) {
                    setCategories(data.categories);
                } else {
                    console.error('Failed to fetch categories:', data.error);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            } finally {
                setLoading(false);
            }
        };

        if (t_id) {
            fetchCategories();
        }
    }, [t_id]);

    // 當選擇的類別改變時，通知父組件
    useEffect(() => {
        onCategoryChange(selectedCategories);
    }, [selectedCategories, onCategoryChange]);

    const toggleExpanded = () => {
        const newExpanded = !isExpanded;
        setIsExpanded(newExpanded);
        // 通知父組件展開狀態變化
        if (onExpandChange) {
            onExpandChange(newExpanded);
        }
    };

    const handleCategoryToggle = (category) => {
        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(cat => cat !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const handleCostRangeChange = (event) => {
        const value = parseInt(event.target.value);
        setCostRange([0, value]);
    };

    const getCategoryColor = (category) => {
        const colors = {
            '文化': '#FFB6C1',
            '自然': '#B0E0E6', 
            '餐廳': '#DDA0DD',
            '娛樂': '#98FB98',
            '購物': '#F0E68C',
            '住宿': '#FFA07A'
        };
        return colors[category] || '#E6E6FA';
    };

    if (loading) {
        return <div className="filter-container loading">載入中...</div>;
    }

    return (
        <div className="filter-container">
            <div className="filter-header" onClick={toggleExpanded}>
                <span className="filter-icon">🔍</span>
                <span className="filter-title">篩選:</span>
                
                {/* 費用範圍滑桿 */}
                <div className="cost-range-container">
                    <span className="cost-label">0</span>
                    <input
                        type="range"
                        min="0"
                        max="1000"
                        value={costRange[1]}
                        onChange={handleCostRangeChange}
                        className="cost-slider"
                    />
                    <span className="cost-label">1000</span>
                    <span className="cost-value">{costRange[1]}</span>
                </div>
            </div>

            {isExpanded && (
                <div className="filter-content">
                    <div className="filter-section">
                        <h4>使用者:</h4>
                        <div className="user-options">
                            <span className="user-option selected">👤</span>
                            <span className="user-option">👥</span>
                        </div>
                    </div>

                    <div className="filter-section">
                        <h4>類別:</h4>
                        <div className="category-grid">
                            {categories.map((category) => (
                                <div
                                    key={category}
                                    className={`category-item ${selectedCategories.includes(category) ? 'selected' : ''}`}
                                    style={{ backgroundColor: getCategoryColor(category) }}
                                    onClick={() => handleCategoryToggle(category)}
                                >
                                    <span className="category-text">{category}</span>
                                    <span className="category-icon">🔗</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="filter-section">
                        <h4>市集:</h4>
                        <div className="market-options">
                            <span className="market-option">市集 🔗</span>
                            <span className="market-option">市集 🔗</span>
                            <span className="market-option">市集 🔗</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Filter;
