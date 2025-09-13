import React from 'react';
import type { AssignModalProps } from '../../types/jira';
import styles from './Modal.module.css';

export const AssignModal: React.FC<AssignModalProps> = ({
    show, onClose, issue, users, issues, onAssign
}) => {
    if (!show || !issue) return null;
    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <h3>👤 Назначить исполнителя</h3>
                <p><strong>Задача:</strong> {issue.key} - {issue.summary}</p>
                <p>Выберите исполнителя из активных участников:</p>
                <div className={styles.modalList}>
                    {users.length > 0 ? users.map(user => {
                        const assignedCount = issues.filter(i => i.assignee && i.assignee.accountId === user.accountId).length;
                        return (
                            <button
                                key={user.accountId}
                                onClick={() => onAssign(user.accountId)}
                                className="btn btn--primary btn--block"
                            >
                                <div>{user.displayName}</div>
                                <div className="muted">📋 Текущих задач: {assignedCount}/2 (может взять еще {2 - assignedCount})</div>
                            </button>
                        );
                    }) : (
                        <div className="alert alert--danger">
                            <strong>⚠️ Нет доступных участников</strong>
                            <p>Все участники уже имеют максимальную загрузку (2 задачи).</p>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="btn btn--secondary">Отмена</button>
            </div>
        </div>
    );
};
