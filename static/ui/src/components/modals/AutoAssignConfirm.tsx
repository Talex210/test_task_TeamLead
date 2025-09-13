import React from 'react';
import type { AutoAssignConfirmProps } from '../../types/jira';
import styles from './Modal.module.css';

export const AutoAssignConfirm: React.FC<AutoAssignConfirmProps & { activeUsersCount: number }> = ({
    show, onClose, unassignedIssues, onConfirm, activeUsersCount
}) => {
    if (!show) return null;
    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                <h3>🔄 Подтверждение массового назначения</h3>
                <p>Вы собираетесь автоматически назначить исполнителей для <strong>{unassignedIssues.length}</strong> задач без исполнителя.</p>

                <div className="box">
                    <p className="box__title">Задачи для назначения:</p>
                    <ul className="list">
                        {unassignedIssues.slice(0, 5).map(issue => (
                            <li key={issue.id}>{issue.key} - {issue.summary}</li>
                        ))}
                        {unassignedIssues.length > 5 && (
                            <li className="muted">...и еще {unassignedIssues.length - 5} задач</li>
                        )}
                    </ul>
                </div>

                <div className="note info">
                    <strong>ℹ️ Как это работает:</strong> Исполнители назначаются случайно из активных участников
                    (у которых меньше 2 задач). Доступно участников: <strong>{activeUsersCount}</strong>
                </div>

                <div className={styles.modalActions}>
                    <button className="btn btn--secondary" onClick={onClose}>Отмена</button>
                    <button className="btn btn--success" onClick={onConfirm}>🔄 Подтвердить назначение</button>
                </div>
            </div>
        </div>
    );
};
