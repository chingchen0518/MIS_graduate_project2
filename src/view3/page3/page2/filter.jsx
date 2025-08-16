import React, { useState, useEffect } from 'react';
import './Filter.css';

const users = [
    { id: 1, name: '小明', img: 'img/avatar1.png' },
    { id: 2, name: '小美', img: 'img/avatar2.png' },
];

function Filter({ onFilterChange }) {
    const [budget, setBudget] = useState([0, 650]);
    const [budgetChecked, setBudgetChecked] = useState(false);
    const [userChecked, setUserChecked] = useState(false);
    const [categoryChecked, setCategoryChecked] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetch('/api/filter/categories')
            .then(res => res.json())
            .then(data => setCategories(data));
    }, []);

    // 預算滑桿
    const handleBudgetChange = (e, idx) => {
        const val = Number(e.target.value);
        setBudget(prev => idx === 0 ? [val, prev[1]] : [prev[0], val]);
    };

    // 使用者選擇
    const handleUserClick = (id) => {
        setSelectedUsers(prev =>
            prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
        );
    };

    // 類別選擇
    const handleCategoryClick = (label) => {
        setSelectedCategories(prev =>
            prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]
        );
    };

    // 可在此呼叫 onFilterChange 傳遞篩選結果

    return (
        <div className="filter">
            <div className="filter-row">
                <input type="checkbox" checked={budgetChecked} onChange={e => setBudgetChecked(e.target.checked)} />
                <span>預算:</span>
                <div className="filter-budget">
                    <span className="filter-budget-value">{budget[0]}</span>
                    <div className="filter-budget-sliders">
                        <input
                            type="range"
                            min={0}
                            max={1000}
                            value={budget[0]}
                            onChange={e => handleBudgetChange(e, 0)}
                            disabled={!budgetChecked}
                            className="filter-budget-range"
                            style={{ position: 'absolute', left: 0, width: '180px', pointerEvents: 'auto', zIndex: 2 }}
                        />
                        <input
                            type="range"
                            min={0}
                            max={1000}
                            value={budget[1]}
                            onChange={e => handleBudgetChange(e, 1)}
                            disabled={!budgetChecked}
                            className="filter-budget-range"
                            style={{ position: 'absolute', left: 0, width: '180px', pointerEvents: 'auto', zIndex: 3 }}
                        />
                    </div>
                    <span className="filter-budget-value">{budget[1]}</span>
                </div>
            </div>
            <div className="filter-row">
                <input type="checkbox" checked={userChecked} onChange={e => setUserChecked(e.target.checked)} />
                <span>使用者:</span>
                <div className="filter-users">
                    {users.map(u => (
                        <img
                            key={u.id}
                            src={u.img}
                            alt={u.name}
                            className={`filter-user-avatar${selectedUsers.includes(u.id) ? ' selected' : ''}`}
                            onClick={() => userChecked && handleUserClick(u.id)}
                            style={{ opacity: userChecked ? 1 : 0.5, cursor: userChecked ? 'pointer' : 'not-allowed' }}
                        />
                    ))}
                </div>
            </div>
            <div className="filter-row">
                <input type="checkbox" checked={categoryChecked} onChange={e => setCategoryChecked(e.target.checked)} />
                <span>類別:</span>
                <div className="filter-categories">
                    {categories.map((cat, idx) => (
                        <label
                            key={cat}
                            className="filter-category"
                            style={{
                                opacity: categoryChecked ? 1 : 0.5,
                                cursor: categoryChecked ? 'pointer' : 'not-allowed'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(cat)}
                                onChange={() => categoryChecked && handleCategoryClick(cat)}
                                disabled={!categoryChecked}
                            />
                            {cat}
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}
export default Filter;
