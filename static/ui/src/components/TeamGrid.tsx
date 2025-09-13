import React from 'react';
import type { JiraIssue, JiraUser } from '../types/jira';

export const TeamGrid: React.FC<{
    users: JiraUser[];
    issues: JiraIssue[];
    getUserActivity: (user: JiraUser) => boolean;
}> = ({ users, issues, getUserActivity }) => {
    return (
        <div>
            <h3>👥 Команда проекта</h3>
            <div className="note info">
                <strong>ℹ️ Логика активности:</strong> Максимум 2 задачи на участника.
                Участники с 2 задачами считаются неактивными и не могут получить новые задачи.
            </div>
            <div className="team-grid">
                {users.map(user => {
                    const assignedCount = issues.filter(issue =>
                        issue.assignee && issue.assignee.accountId === user.accountId
                    ).length;
                    const isUserActive = getUserActivity(user);

                    return (
                        <div key={user.accountId} className={`card ${isUserActive ? 'card--active' : 'card--inactive'}`}>
                            <div className="card__title">{user.displayName}</div>
                            <div className="card__meta">
                                📋 Назначено задач: <strong>{assignedCount} / 2</strong>
                            </div>
                            <div className="card__status">
                                ⚡ Статус: <span className={`status ${isUserActive ? 'green' : 'red'}`}>
                  {isUserActive ? '🟢 Может взять задачи' : '🔴 Загружен (2/2)'}
                </span>
                            </div>
                            {!isUserActive && (
                                <div className="pill pill--danger">
                                    Максимальная загрузка - не может взять новые задачи
                                </div>
                            )}
                            {isUserActive && assignedCount > 0 && (
                                <div className="pill pill--success">
                                    Может взять еще {2 - assignedCount} {2 - assignedCount === 1 ? 'задачу' : 'задачи'}
                                </div>
                            )}
                            {isUserActive && assignedCount === 0 && (
                                <div className="pill pill--info">
                                    Свободен - может взять до 2 задач
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
