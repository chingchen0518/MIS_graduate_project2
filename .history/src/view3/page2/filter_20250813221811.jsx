import React, { useState, useEffect } from 'react';
import './Filter.css';

const Filter = ({ t_id, onCategoryChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [costRange, setCostRange] = useState([0, 650]);
    const [maxBudget, setMaxBudget] = useState(1000);
    const [minBudget, setMinBudget] = useState(0);
    const [loading, setLoading] = useState(true);
    const [expandedCategory, setExpandedCategory] = useState(null);
    const [attractions, setAttractions] = useState([]);
    const [selectedAttractions, setSelectedAttractions] = useState([]);
    const [categoryAttractions, setCategoryAttractions] = useState({});

    // 從資料庫獲取指定trip的景點類別和預算範圍
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 獲取指定trip的景點類別
                const categoriesResponse = await fetch(`http://localhost:3001/api/attraction_categories/${t_id}`);
                const categoriesData = await categoriesResponse.json();

                // 獲取該trip的預算範圍
                const budgetResponse = await fetch(`http://localhost:3001/api/view3_trip_budget_range/${t_id}`);
                const budgetData = await budgetResponse.json();

                if (categoriesData.success) {
                    setCategories(categoriesData.categories);
                } else {
                    console.error('Failed to fetch categories:', categoriesData.error);
                    // 設置預設類別以供測試
                    setCategories(['文化', '自然', '餐廳', '娛樂', '購物', '住宿']);
                }

                if (budgetData.success) {
                    setMinBudget(budgetData.minBudget);
                    setMaxBudget(budgetData.maxBudget);
                    setCostRange([budgetData.minBudget, budgetData.maxBudget]);
                } else {
                    console.error('Failed to fetch budget range:', budgetData.error);
                }

                // 獲取該trip的所有景點
                try {
                    const attractionsResponse = await fetch(`http://localhost:3001/api/view2_attraction_list`);
                    const attractionsData = await attractionsResponse.json();
                    
                    if (attractionsData && Array.isArray(attractionsData)) {
                        setAttractions(attractionsData);
                        // 按類別分組景點
                        const grouped = {};
                        attractionsData.forEach(attraction => {
                            if (!grouped[attraction.category]) {
                                grouped[attraction.category] = [];
                            }
                            grouped[attraction.category].push(attraction);
                        });
                        setCategoryAttractions(grouped);
                    }
                } catch (attractionError) {
                    console.error('Error fetching attractions:', attractionError);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (t_id) {
            fetchData();
        }
    }, [t_id]);

    // 當選擇的類別改變時，通知父組件
    useEffect(() => {
        onCategoryChange(selectedCategories);
    }, [selectedCategories, onCategoryChange]);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const handleFilterIconClick = (e) => {
        e.stopPropagation();
        toggleExpanded();
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

    const handleCategoryExpand = (category) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    const handleAttractionToggle = (attractionId) => {
        setSelectedAttractions(prev => {
            if (prev.includes(attractionId)) {
                return prev.filter(id => id !== attractionId);
            } else {
                return [...prev, attractionId];
            }
        });
    };

    const getSelectedAttractionsCountForCategory = (category) => {
        const categoryAtts = categoryAttractions[category] || [];
        return categoryAtts.filter(att => selectedAttractions.includes(att.a_id)).length;
    };

    const handleCostRangeChange = (event) => {
        const value = parseInt(event.target.value);
        setCostRange([minBudget, value]);
    };

    // 計算滑桿的背景漸變
    const getSliderBackground = () => {
        if (maxBudget === minBudget) return '#ddd';
        const percentage = ((costRange[1] - minBudget) / (maxBudget - minBudget)) * 100;
        return `linear-gradient(to right, #4A90E2 0%, #4A90E2 ${percentage}%, #ddd ${percentage}%, #ddd 100%)`;
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
            <div className="filter-header">
                <span className="filter-icon" onClick={handleFilterIconClick}>🔍</span>
                <span className="filter-title">篩選:</span>

                {/* 費用範圍滑桿 */}
                <div className="cost-range-container">
                    <span className="cost-label">{minBudget}</span>
                    <input
                        type="range"
                        min={minBudget}
                        max={maxBudget}
                        value={costRange[1]}
                        onChange={handleCostRangeChange}
                        className="cost-slider"
                        style={{ background: getSliderBackground() }}
                    />
                    <span className="cost-label">{maxBudget}</span>
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
                        {expandedCategory ? (
                            <div className="expanded-category">
                                <div className="expanded-category-header">
                                    <span className="expanded-category-title">{expandedCategory}</span>
                                    <button 
                                        className="collapse-button"
                                        onClick={() => setExpandedCategory(null)}
                                    >
                                        ↩
                                    </button>
                                </div>
                                <div className="attractions-grid">
                                    {(categoryAttractions[expandedCategory] || []).map((attraction) => (
                                        <div key={attraction.a_id} className="attraction-item">
                                            <label className="attraction-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAttractions.includes(attraction.a_id)}
                                                    onChange={() => handleAttractionToggle(attraction.a_id)}
                                                />
                                                <span className="attraction-name">
                                                    +{attraction.name_zh || attraction.name}
                                                </span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="category-list">
                                {categories.map((category) => {
                                    const selectedCount = getSelectedAttractionsCountForCategory(category);
                                    return (
                                        <div
                                            key={category}
                                            className={`category-row ${selectedCategories.includes(category) ? 'selected' : ''}`}
                                            style={{ backgroundColor: getCategoryColor(category) }}
                                        >
                                            <label className="category-checkbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.includes(category)}
                                                    onChange={() => handleCategoryToggle(category)}
                                                />
                                                <span className="category-name">{category}</span>
                                            </label>
                                            <div className="category-actions">
                                                {selectedCount > 0 && (
                                                    <span className="selected-count">{selectedCount}</span>
                                                )}
                                                <button 
                                                    className="expand-button"
                                                    onClick={() => handleCategoryExpand(category)}
                                                >
                                                    🔍
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Filter;
