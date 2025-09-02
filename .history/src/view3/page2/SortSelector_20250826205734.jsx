import React from 'react';
import './SortSelector.css';

const SortSelector = ({ sortBy, onSortChange }) => {
    const sortOptions = [
        { value: 'default', label: '預設排序' },
        { value: 'attractions_count', label: '景點數量' },
        { value: 'total_duration', label: '總遊玩時間' },
        { value: 'categories_count', label: '類別數量' }
    ];

    return (
        <select 
            value={sortBy} 
            onChange={(e) => onSortChange(e.target.value)}
            className="sort-selector"
        >
            {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default SortSelector;
