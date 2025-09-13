import React from 'react';
import type { PriorityModalProps } from '../../types/jira';

export const PriorityModal: React.FC<PriorityModalProps> = ({
                                                                show, onClose, issue, onUpdatePriority
                                                            }) => {
    if (!show || !issue) return null;
    return (
        <div className="modal">
            <div className="modal__content">
                <h3>⬆️ Повысить приоритет</h3>
                <p><strong>Задача:</strong> {issue.key} - {issue.summary}</p>
                <p><strong>Текущий приоритет:</strong> {issue.priority.name}</p>
                <p><strong>Дедлайн:</strong> {issue.duedate}</p>
                <p>Задача имеет низкий приоритет, но близкий дедлайн. Выберите новый приоритет:</p>
                <div className="modal__actions-vertical">
                    <button className="btn btn--warning" onClick={() => onUpdatePriority('3')}>⬆️ Повысить до Medium</button>
                    <button className="btn btn--danger" onClick={() => onUpdatePriority('2')}>⬆️⬆️ Повысить до High</button>
                    <button className="btn btn--secondary" onClick={onClose}>Отмена</button>
                </div>
            </div>
        </div>
    );
};
