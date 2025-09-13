import React from 'react';
import styles from './Tabs.module.css';

export const Tabs: React.FC<{
    activeTab: 'issues' | 'team';
    onChange: (tab: 'issues' | 'team') => void;
}> = ({ activeTab, onChange }) => {
    return (
        <div className={styles.tabs}>
            <button
                onClick={() => onChange('issues')}
                className={`${styles.tab} ${activeTab === 'issues' ? styles.tabActive : ''}`}
            >
                📋 Задачи проекта
            </button>
            <button
                onClick={() => onChange('team')}
                className={`${styles.tab} ${activeTab === 'team' ? styles.tabActive : ''}`}
            >
                👥 Team
            </button>
        </div>
    );
};
