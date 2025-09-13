import React from 'react';

export const Tabs: React.FC<{
    activeTab: 'issues' | 'team';
    onChange: (tab: 'issues' | 'team') => void;
}> = ({ activeTab, onChange }) => {
    return (
        <div className="tabs">
            <button
                onClick={() => onChange('issues')}
                className={`tab ${activeTab === 'issues' ? 'tab--active' : ''}`}
            >
                📋 Задачи проекта
            </button>
            <button
                onClick={() => onChange('team')}
                className={`tab ${activeTab === 'team' ? 'tab--active' : ''}`}
            >
                👥 Team
            </button>
        </div>
    );
};
