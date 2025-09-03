import React, { useState, useEffect } from 'react';
import './Filter.css';

const Filter = ({ t_id, onCategoryChange, onFilterChange }) => {
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
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

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

                // 獲取該trip的參與使用者
                try {
                    const usersResponse = await fetch(`http://localhost:3001/api/trip_users/${t_id}`);
                    const usersData = await usersResponse.json();

                    if (usersData.success && usersData.users) {
                        setUsers(usersData.users);
                        // 初始狀態：所有使用者都沒有被選中
                        setSelectedUsers([]);
                    }
                } catch (userError) {
                    console.error('Error fetching users:', userError);
                    // 設置預設使用者數據
                    const defaultUsers = [
                        { u_id: 1, u_name: '使用者1', u_img: 'avatar.jpg', color: '#FF5733' },
                        { u_id: 2, u_name: '使用者2', u_img: null, color: '#33A1FF' }
                    ];
                    setUsers(defaultUsers);
                    setSelectedUsers([]); // 初始狀態：沒有使用者被選中
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                // 設置預設值以防 API 調用失敗
                setCategories(['文化', '自然', '餐廳', '娛樂', '購物', '住宿']);
                setMinBudget(0);
                setMaxBudget(1000);
                setCostRange([0, 1000]);
                // 設置預設景點數據
                const defaultAttractions = {
                    '文化': [
                        { a_id: 1, name_zh: '十鼓文化村', category: '文化' },
                        { a_id: 2, name_zh: '十鼓文化村', category: '文化' }
                    ],
                    '自然': [
                        { a_id: 3, name_zh: '自然景點1', category: '自然' }
                    ]
                };
                setCategoryAttractions(defaultAttractions);
                // 設置預設使用者數據
                const defaultUsers = [
                    { u_id: 1, u_name: '使用者1', u_img: 'avatar.jpg', color: '#FF5733' },
                    { u_id: 2, u_name: '使用者2', u_img: null, color: '#33A1FF' }
                ];
                setUsers(defaultUsers);
                setSelectedUsers([]); // 初始狀態：沒有使用者被選中
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

    // 當篩選條件改變時，通知父組件
    useEffect(() => {
        if (onFilterChange) {
            onFilterChange(costRange, selectedAttractions, selectedUsers);
        }
    }, [costRange, selectedAttractions, selectedUsers, onFilterChange]);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    const handleFilterIconClick = (e) => {
        e.stopPropagation();
        toggleExpanded();
    };

    const handleCategoryToggle = (category) => {
        const categoryAtts = categoryAttractions[category] || [];
        const categoryAttractionIds = categoryAtts.map(att => att.a_id);

        setSelectedCategories(prev => {
            if (prev.includes(category)) {
                // 取消勾選類別，同時取消勾選該類別下的所有景點
                setSelectedAttractions(prevAtts =>
                    prevAtts.filter(id => !categoryAttractionIds.includes(id))
                );
                return prev.filter(cat => cat !== category);
            } else {
                // 勾選類別，同時勾選該類別下的所有景點
                setSelectedAttractions(prevAtts => {
                    const newAtts = [...prevAtts];
                    categoryAttractionIds.forEach(id => {
                        if (!newAtts.includes(id)) {
                            newAtts.push(id);
                        }
                    });
                    return newAtts;
                });
                return [...prev, category];
            }
        });
    };

    const handleCategoryExpand = (category) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    const handleAttractionToggle = (attractionId) => {
        setSelectedAttractions(prev => {
            const newSelectedAttractions = prev.includes(attractionId)
                ? prev.filter(id => id !== attractionId)
                : [...prev, attractionId];

            // 檢查是否需要更新類別選中狀態
            const attraction = attractions.find(att => att.a_id === attractionId);
            if (attraction) {
                const category = attraction.category;
                const categoryAtts = categoryAttractions[category] || [];
                const categoryAttractionIds = categoryAtts.map(att => att.a_id);

                // 檢查該類別下的所有景點是否都被選中
                const allCategoryAttractionsSelected = categoryAttractionIds.every(id =>
                    newSelectedAttractions.includes(id)
                );

                setSelectedCategories(prevCategories => {
                    if (allCategoryAttractionsSelected && !prevCategories.includes(category)) {
                        // 如果該類別的所有景點都被選中，自動勾選類別
                        return [...prevCategories, category];
                    } else if (!allCategoryAttractionsSelected && prevCategories.includes(category)) {
                        // 如果該類別不是所有景點都被選中，但類別被勾選，則取消勾選類別
                        // 這包括：1) 取消某個景點時 2) 沒有任何景點被選中時
                        return prevCategories.filter(cat => cat !== category);
                    }
                    return prevCategories;
                });
            }

            return newSelectedAttractions;
        });
    };

    const getSelectedAttractionsCountForCategory = (category) => {
        const categoryAtts = categoryAttractions[category] || [];
        return categoryAtts.filter(att => selectedAttractions.includes(att.a_id)).length;
    };

    const handleCostRangeChange = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const value = parseInt(event.target.value);
        console.log('滑桿值變更:', value); // 除錯用
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
                            {users.map((user) => (
                                <div
                                    key={user.u_id}
                                    className={`user-option ${selectedUsers.includes(user.u_id) ? '' : 'selected'}`}
                                    style={{ backgroundColor: user.color }}
                                    onClick={() => handleUserToggle(user.u_id)}
                                    title={user.u_name}
                                >
                                    {user.u_img ? (
                                        <img
                                            src={`/img/avatar/${user.u_img}`}
                                            alt={user.u_name}
                                            className="user-avatar"
                                        />
                                    ) : (
                                        <span className="user-icon">�</span>
                                    )}
                                </div>
                            ))}
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
