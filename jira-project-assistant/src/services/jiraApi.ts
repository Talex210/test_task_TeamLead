import api, { route } from '@forge/api';
import { JiraIssue, JiraProject, JiraUser } from '../types/jira';

export class JiraApiService {
  
  // Получение списка проектов
  static async getProjects(): Promise<JiraProject[]> {
    const response = await api.asApp().requestJira(route`/rest/api/3/project`);
    const data = await response.json();
    return data;
  }
  
  // Получение задач проекта
  static async getProjectIssues(projectKey: string): Promise<JiraIssue[]> {
    const jql = `project = ${projectKey} ORDER BY created DESC`;
    const response = await api.asApp().requestJira(
      route`/rest/api/3/search?jql=${jql}&fields=summary,status,assignee,priority,duedate,created,updated`
    );
    const data = await response.json();
    return data.issues;
  }
  
  // Получение пользователей проекта
  static async getProjectUsers(projectKey: string): Promise<JiraUser[]> {
    const response = await api.asApp().requestJira(
      route`/rest/api/3/user/assignable/search?project=${projectKey}`
    );
    const data = await response.json();
    return data;
  }
  
  // Обновление исполнителя задачи
  static async updateIssueAssignee(issueKey: string, accountId: string): Promise<void> {
    await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}/assignee`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: accountId
      })
    });
  }
  
  // Обновление приоритета задачи
  static async updateIssuePriority(issueKey: string, priorityId: string): Promise<void> {
    await api.asApp().requestJira(route`/rest/api/3/issue/${issueKey}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          priority: {
            id: priorityId
          }
        }
      })
    });
  }
}