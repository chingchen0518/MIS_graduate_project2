import React, { useState, useEffect } from 'react';
import './Filter.css';

const Filter = ({ t_id, onCategoryChange }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [costRange, setCostRange] = useState([0, 650]);
    const [maxBudget, setMaxBudget] = useState(1000);
    const [minBudget, setMinBudget] = useState(0);
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [loading, setLoading] = useState(true);

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

                // 獲取該trip的參與使用者
                const usersResponse = await fetch(`http://localhost:3001/api/trip_users/${t_id}`);
                const usersData = await usersResponse.json();

                if (categoriesData.success) {
                    setCategories(categoriesData.categories);
                } else {
                    console.error('Failed to fetch categories:', categoriesData.error);
                }

                if (budgetData.success) {
                    setMinBudget(budgetData.minBudget);
                    setMaxBudget(budgetData.maxBudget);
                    setCostRange([budgetData.minBudget, budgetData.maxBudget]);
                } else {
                    console.error('Failed to fetch budget range:', budgetData.error);
                }

                if (usersData.success) {
                    setUsers(usersData.users);
                    // 預設選擇所有使用者
                    setSelectedUsers(usersData.users.map(user => user.u_id));
                } else {
                    console.error('Failed to fetch users:', usersData.error);
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

    const handleCostRangeChange = (event) => {
        const value = parseInt(event.target.value);
        setCostRange([minBudget, value]);
    };

    const handleUserToggle = (userId) => {
        setSelectedUsers(prev => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
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
                            {users.map((user) => (
                                <div
                                    key={user.u_id}
                                    className={`user-option ${selectedUsers.includes(user.u_id) ? 'selected' : ''}`}
                                    onClick={() => handleUserToggle(user.u_id)}
                                    style={{ 
                                        backgroundColor: selectedUsers.includes(user.u_id) ? user.color : '#f0f0f0',
                                        border: `2px solid ${user.color || '#ccc'}`
                                    }}
                                    title={user.u_name}
                                >
                                    {user.u_img ? (
                                        <img 
                                            src={`http://localhost:3001/img/avatar/${user.u_img}`} 
                                            alt={user.u_name}
                                            className="user-avatar"
                                        />
                                    ) : (
                                        <span className="user-initial">
                                            {user.u_name ? user.u_name.charAt(0).toUpperCase() : '?'}
                                        </span>
                                    )}
                                </div>
                            ))}
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
                </div>
            )}
        </div>
    );
};

export default Filter;
