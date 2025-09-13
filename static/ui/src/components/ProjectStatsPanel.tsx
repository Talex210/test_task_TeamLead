import React from 'react';
import type { JiraIssue, JiraUser, JiraProject } from '../types/jira';
import styles from './ProjectStatsPanel.module.css';

export const ProjectStatsPanel: React.FC<{
    issues: JiraIssue[];
    users: JiraUser[];
    projects: JiraProject[];
    currentProject: string;
    onProjectChange: (key: string) => void;
    unassignedCount: number;
    problemCount: number;
    onOpenAutoAssign: () => void;
    canAutoAssign: boolean;
    activeUsersCount: number;
}> = ({
          issues, users, projects, currentProject, onProjectChange,
          unassignedCount, problemCount, onOpenAutoAssign, canAutoAssign, activeUsersCount
      }) => {
    return (
        <div className={styles.panel}>
            <div className={styles.panelHeader}>
                <h3>📊 Статистика проекта</h3>
                <div className={styles.panelProject}>
                    <label htmlFor="project-select">Проект:</label>
                    <select
                        id="project-select"
                        value={currentProject}
                        onChange={(e) => onProjectChange(e.target.value)}
                    >
                        {projects.map(project => (
                            <option key={project.key} value={project.key}>
                                {project.key} - {project.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.panelStats}>
                <span>Всего задач: <strong>{issues.length}</strong></span>
                <span>Без исполнителя: <strong className={unassignedCount > 0 ? 'text-red' : 'text-green'}>
          {unassignedCount}
        </strong></span>
                <span>Проблемных: <strong className={problemCount > 0 ? 'text-orange' : 'text-green'}>
          {problemCount}
        </strong></span>
                <span>Участников: <strong>{users.length}</strong></span>
            </div>

            {unassignedCount > 0 && (
                <div className={styles.panelActions}>
                    <button
                        onClick={onOpenAutoAssign}
                        disabled={!canAutoAssign}
                        className={`btn ${canAutoAssign ? 'btn--primary' : 'btn--disabled'}`}
                    >
                        🔄 Auto-assign unassigned ({unassignedCount})
                    </button>
                    {!canAutoAssign && (
                        <span className="hint danger">⚠️ Все участники загружены (2/2 задачи)</span>
                    )}
                    {canAutoAssign && (
                        <span className="hint info">Доступно участников: <strong>{activeUsersCount}</strong></span>
                    )}
                </div>
            )}
        </div>
    );
};
