import React from 'react';
import type { JiraIssue } from '../types/jira';
import styles from './IssuesTable.module.css';

export const IssuesTable: React.FC<{
    issues: JiraIssue[];
    onFix: (issue: JiraIssue) => void;
}> = ({ issues, onFix }) => {
    return (
        <div className={styles.section}>
            <h3>📋 Задачи проекта</h3>
            <table className={styles.table}>
                <thead>
                <tr>
                    <th>Key</th>
                    <th>Summary</th>
                    <th>Status</th>
                    <th>Assignee</th>
                    <th>Priority</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {issues.map(issue => {
                    const isUnassigned = !issue.assignee;
                    const isLowPriority = issue.priority.name === 'Low' || issue.priority.name === 'Lowest';
                    const isLowPriorityWithDeadline = isLowPriority && issue.duedate &&
                        new Date(issue.duedate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

                    return (
                        <tr
                            key={issue.id}
                            className={
                                isUnassigned ? styles.rowRed :
                                    isLowPriorityWithDeadline ? styles.rowOrange : undefined
                            }
                        >
                            <td>
                                <div className={styles.cellKey}>
                                    {isUnassigned && <span className={styles.dotRed}>🔴</span>}
                                    {isLowPriorityWithDeadline && <span className={styles.dotOrange}>🟡</span>}
                                    {issue.key}
                                </div>
                            </td>
                            <td>{issue.summary}</td>
                            <td>{issue.status}</td>
                            <td>{issue.assignee ? issue.assignee.displayName : 'Не назначен'}</td>
                            <td>{issue.priority.name}</td>
                            <td>
                                {(isUnassigned || isLowPriorityWithDeadline) && (
                                    <button className="btn btn--success btn--sm" onClick={() => onFix(issue)}>
                                        🔧 Fix
                                    </button>
                                )}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    )
};
