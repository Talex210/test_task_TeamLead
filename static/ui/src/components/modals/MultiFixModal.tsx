import React from 'react';
import type { JiraIssue } from '../../types/jira';
import styles from './Modal.module.css';

export const MultiFixModal: React.FC<{
    show: boolean;
    issue: JiraIssue | null;
    onChooseAssign: () => void;
    onChoosePriority: () => void;
    onClose: () => void;
}> = ({ show, issue, onChooseAssign, onChoosePriority, onClose }) => {
    if (!show || !issue) return null;
    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <h3>🔧 Выберите действие</h3>
                <p><strong>Задача:</strong> {issue.key} - {issue.summary}</p>
                <p>У этой задачи несколько проблем:</p>
                <ul>
                    <li>🔴 Не назначен исполнитель</li>
                    <li>🟡 Низкий приоритет ({issue.priority.name}) с близким дедлайном ({issue.duedate})</li>
                </ul>
                <p>Что хотите исправить?</p>
                <div className={styles.modalActionsVertical}>
                    <button className="btn btn--primary" onClick={onChooseAssign}>👤 Назначить исполнителя</button>
                    <button className="btn btn--warning" onClick={onChoosePriority}>⬆️ Повысить приоритет</button>
                    <button className="btn btn--secondary" onClick={onClose}>Отмена</button>
                </div>
            </div>
        </div>
    );
};
