# 📚 API Документация - Jira Project Assistant

## 🌟 Обзор

Jira Project Assistant предоставляет полностью типизированный TypeScript API для работы с Jira через Atlassian Forge. Все методы включают обработку ошибок, loading состояния и автоматический fallback на mock данные.

## 📋 Содержание

- [Основные типы](#основные-типы)
- [API Методы](#api-методы)
- [Обработка ошибок](#обработка-ошибок)
- [Mock данные](#mock-данные)
- [Примеры использования](#примеры-использования)
- [Лучшие практики](#лучшие-практики)

## 🔧 Основные TypeScript типы

### JiraIssue - Задача Jira
```typescript
interface JiraIssue {
  id: string;                    // Уникальный ID задачи
  key: string;                   // Ключ задачи (например, "SCRUM-123")
  summary: string;               // Название/описание задачи
  status: string;                // Текущий статус задачи
  assignee: JiraUser | null;     // Назначенный исполнитель или null
  priority: {                    // Приоритет задачи
    name: string;                // Название приоритета (High, Medium, Low)
    id: string;                  // ID приоритета ("1"-"5")
  };
  duedate: string | null;        // Дедлайн в ISO формате или null
  created: string;               // Дата создания в ISO формате
  updated: string;               // Дата последнего обновления в ISO формате
  description?: string;          // Описание задачи (опционально)
  issueType?: string;           // Тип задачи (Story, Bug, Task)
}
```

### JiraUser - Пользователь Jira
``` typescript
interface JiraUser {
  accountId: string;             // Уникальный ID пользователя в Atlassian
  displayName: string;           // Отображаемое имя пользователя
  emailAddress?: string;         // Email адрес (может быть скрыт)
  avatarUrl: string;             // URL аватара пользователя (48x48)
  active: boolean;               // Активен ли аккаунт пользователя
  timeZone?: string;             // Часовой пояс пользователя
  locale?: string;               // Локализация пользователя
}
```
### JiraProject - Проект Jira
``` typescript
interface JiraProject {
  id: string;                    // Уникальный ID проекта
  key: string;                   // Ключ проекта (например, "SCRUM")
  name: string;                  // Полное название проекта
  projectTypeKey: string;        // Тип проекта (software, service_desk, business)
  description?: string;          // Описание проекта
  lead?: JiraUser;              // Руководитель проекта
  avatarUrl?: string;           // Аватар проекта
}
```
### ApiResponse- Унифицированный ответ API
``` typescript
interface ApiResponse<T> {
  success: boolean;              // Статус успешности операции
  data?: T;                      // Данные ответа (при успехе)
  error?: string;                // Сообщение об ошибке (при неудаче)
  message?: string;              // Дополнительное информационное сообщение
  timestamp?: string;            // Временная метка операции
}
```
### ProjectIssuesResponse - Ответ с задачами проекта
``` typescript
interface ProjectIssuesResponse extends ApiResponse<JiraIssue[]> {
  projectKey?: string;           // Ключ проекта, из которого получены задачи
  totalCount?: number;           // Общее количество задач в проекте
  filteredCount?: number;        // Количество отфильтрованных задач
}
```
### AutoAssignResponse - Результат автоназначения
``` typescript
interface AutoAssignResponse extends ApiResponse<AutoAssignResult[]> {
  results?: AutoAssignResult[];  // Детальные результаты для каждой задачи
  summary?: string;              // Краткое резюме операции
  totalAssigned?: number;        // Общее количество назначенных задач
  totalFailed?: number;          // Количество неудачных попыток
}

interface AutoAssignResult {
  issueKey: string;              // Ключ обработанной задачи
  issueTitle?: string;           // Название задачи
  assignedTo?: string;           // Имя назначенного пользователя
  assignedToId?: string;         // ID назначенного пользователя
  success: boolean;              // Успешность конкретного назначения
  error?: string;                // Ошибка для конкретной задачи
}
```
## 🚀 API Методы
### Инициализация
#### JiraAPI.initialize()
Инициализирует API клиент и получает контекст текущего проекта из Jira.
``` typescript
async initialize(): Promise<boolean>
```
**Возвращает:** `Promise<boolean>` - `true` при успешной инициализации
**Описание:**
- Устанавливает соединение с Jira через Forge Bridge
- Получает контекст текущего проекта
- Настраивает внутренние параметры API клиента
- При ошибке автоматически переключается на mock данные

**Пример использования:**
``` typescript
const isInitialized = await JiraAPI.initialize();
if (isInitialized) {
  console.log('✅ API готов к работе');
} else {
  console.log('🎭 Используются mock данные');
}
```
### Управление проектами
#### JiraAPI.getProjects()
Получает список всех доступных проектов для текущего пользователя.
``` typescript
async getProjects(): Promise<ApiResponse<JiraProject[]>>
```
**Возвращает:** `Promise<ApiResponse<JiraProject[]>>`
**Особенности:**
- Возвращает только проекты, к которым у пользователя есть доступ
- Автоматически фильтрует архивные проекты
- Сортирует по имени проекта

**Пример:**
``` typescript
const response = await JiraAPI.getProjects();
if (response.success && response.data) {
  const activeProjects = response.data.filter(p => 
    p.projectTypeKey === 'software'
  );
  console.log(`Найдено ${activeProjects.length} software проектов`);
}
```
#### JiraAPI.setCurrentProject()
Устанавливает активный проект для всех последующих операций.
``` typescript
setCurrentProject(projectKey: string): string
```
**Параметры:**
- `projectKey: string` - Ключ проекта (например, "SCRUM", "KANBAN")

**Возвращает:** `string` - Установленный ключ проекта
**Важно:** Этот метод синхронный и сохраняет состояние внутри API клиента
**Пример:**
``` typescript
// Переключение на проект SCRUM
const currentProject = JiraAPI.setCurrentProject('SCRUM');
console.log(`Активный проект: ${currentProject}`);

// Все последующие вызовы будут для проекта SCRUM
const issues = await JiraAPI.getProjectIssues();
```
#### JiraAPI.getCurrentProject()
Получает ключ текущего активного проекта.
``` typescript
getCurrentProject(): string | null
```
**Возвращает:** `string | null` - Ключ проекта или если не установлен `null`
**Пример:**
``` typescript
const currentProject = JiraAPI.getCurrentProject();
if (currentProject) {
  console.log(`Работаем с проектом: ${currentProject}`);
} else {
  console.log('Проект не выбран');
}
```
### Управление задачами
#### JiraAPI.getProjectIssues()
Получает все задачи текущего активного проекта.
``` typescript
async getProjectIssues(): Promise<ProjectIssuesResponse>
```
**Возвращает:** `Promise<ProjectIssuesResponse>`
**Особенности:**
- Загружает до 100 задач за раз (лимит API)
- Включает полную информацию о задачах (статус, исполнитель, приоритет)
- Автоматически парсит даты в ISO формат
- Требует предварительной установки проекта через `setCurrentProject()`

**Пример:**
``` typescript
JiraAPI.setCurrentProject('SCRUM');
const response = await JiraAPI.getProjectIssues();

if (response.success && response.data) {
  const unassignedIssues = response.data.filter(issue => 
    !issue.assignee
  );
  console.log(`Задач без исполнителя: ${unassignedIssues.length}`);
  console.log(`Всего задач в проекте ${response.projectKey}: ${response.data.length}`);
}
```
#### JiraAPI.updateIssueAssignee()
Назначает или изменяет исполнителя задачи.
``` typescript
async updateIssueAssignee(
  issueKey: string, 
  accountId: string
): Promise<ApiResponse<void>>
```
**Параметры:**
- `issueKey: string` - Ключ задачи (например, "SCRUM-123")
- `accountId: string` - ID аккаунта пользователя из поля `JiraUser.accountId`

**Возвращает:** `Promise<ApiResponse<void>>`
**Важно:**
- Пользователь должен иметь права на назначение исполнителей
- Назначаемый пользователь должен иметь доступ к проекту
- Операция необратима через API (нужно назначать другого пользователя)

**Пример:**
``` typescript
const response = await JiraAPI.updateIssueAssignee(
  'SCRUM-123', 
  'user-account-id-12345'
);

if (response.success) {
  console.log('✅ Исполнитель назначен успешно');
  // Обновляем UI оптимистично
  updateIssueInState(issueKey, { assignee: selectedUser });
} else {
  console.error('❌ Ошибка назначения:', response.error);
  // Показываем ошибку пользователю
  showErrorNotification(response.error);
}
```
#### JiraAPI.updateIssuePriority()
Обновляет приоритет задачи.
``` typescript
async updateIssuePriority(
  issueKey: string, 
  priorityId: string
): Promise<ApiResponse<void>>
```
**Параметры:**
- `issueKey: string` - Ключ задачи
- `priorityId: string` - ID приоритета:
    - `"1"` = Highest (Критический)
    - `"2"` = High (Высокий)
    - `"3"` = Medium (Средний)
    - `"4"` = Low (Низкий)
    - `"5"` = Lowest (Минимальный)

**Возвращает:** `Promise<ApiResponse<void>>`
**Пример повышения приоритета:**
``` typescript
// Повышаем приоритет задачи до High
const response = await JiraAPI.updateIssuePriority('SCRUM-123', '2');

if (response.success) {
  console.log('✅ Приоритет повышен до High');
  // Обновляем локальное состояние
  updateIssueInState('SCRUM-123', { 
    priority: { id: '2', name: 'High' } 
  });
} else {
  console.error('❌ Не удалось изменить приоритет:', response.error);
}
```
### Управление пользователями
#### JiraAPI.getProjectUsers()
Получает всех пользователей, которые могут быть назначены на задачи в проекте.
``` typescript
async getProjectUsers(): Promise<ApiResponse<JiraUser[]>>
```
**Возвращает:** `Promise<ApiResponse<JiraUser[]>>`
**Особенности:**
- Возвращает только пользователей с правами на проект
- Включает активных и неактивных пользователей (фильтрация на стороне клиента)
- Загружает аватары пользователей
- Требует установленного текущего проекта

**Пример с фильтрацией активных пользователей:**
``` typescript
const response = await JiraAPI.getProjectUsers();

if (response.success && response.data) {
  const activeUsers = response.data.filter(user => user.active);
  const inactiveUsers = response.data.filter(user => !user.active);
  
  console.log(`Активных пользователей: ${activeUsers.length}`);
  console.log(`Неактивных пользователей: ${inactiveUsers.length}`);
  
  // Можем использовать для автоназначения только активных
  return activeUsers;
}
```
### Автоматизация
#### JiraAPI.autoAssignUnassigned()
Автоматически назначает исполнителей на все задачи без исполнителя в текущем проекте.
``` typescript
async autoAssignUnassigned(): Promise<AutoAssignResponse>
```
**Возвращает:** `Promise<AutoAssignResponse>`
**Алгоритм работы:**
1. Находит все задачи без исполнителя в текущем проекте
2. Получает список активных пользователей проекта
3. Подсчитывает текущую загрузку каждого пользователя
4. Исключает пользователей с 2+ назначенными задачами
5. Случайно распределяет задачи среди доступных пользователей
6. Выполняет назначение и возвращает детальный отчет

**Ограничения:**
- Максимум 2 задачи на пользователя (настраивается в коде)
- Только активные пользователи (`active: true`)
- Требует права на редактирование задач

**Пример использования:**
``` typescript
const response = await JiraAPI.autoAssignUnassigned();

if (response.success && response.results) {
  const successful = response.results.filter(r => r.success);
  const failed = response.results.filter(r => !r.success);
  
  console.log(`✅ Успешно назначено: ${successful.length} задач`);
  console.log(`❌ Ошибки назначения: ${failed.length} задач`);
  console.log(`📊 Резюме: ${response.summary}`);
  
  // Показываем детали неудачных попыток
  failed.forEach(result => {
    console.error(`❌ ${result.issueKey}: ${result.error}`);
  });
  
  // Обновляем UI после массовой операции
  await refreshProjectData();
}
```
**Пример детального анализа результатов:**
``` typescript
const analyzeAutoAssignResults = (response: AutoAssignResponse) => {
  if (!response.results) return;
  
  // Группируем по пользователям
  const assignmentsByUser = response.results
    .filter(r => r.success)
    .reduce((acc, result) => {
      const user = result.assignedTo || 'Unknown';
      acc[user] = (acc[user] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
  console.log('📊 Распределение задач по пользователям:');
  Object.entries(assignmentsByUser).forEach(([user, count]) => {
    console.log(`  👤 ${user}: ${count} задач`);
  });
  
  // Анализ ошибок
  const errorTypes = response.results
    .filter(r => !r.success)
    .reduce((acc, result) => {
      const errorType = result.error?.split(':')[0] || 'Unknown';
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
  if (Object.keys(errorTypes).length > 0) {
    console.log('❌ Типы ошибок:');
    Object.entries(errorTypes).forEach(([error, count]) => {
      console.log(`  ⚠️ ${error}: ${count} раз`);
    });
  }
};
```
## 🛡️ Обработка ошибок
### Стратегия обработки ошибок
API использует многоуровневую стратегию обработки ошибок:
1. **Network Level** - сетевые проблемы и недоступность API
2. **API Level** - ошибки Jira API (401, 403, 404, 500)
3. **Validation Level** - некорректные данные или параметры
4. **Application Level** - логические ошибки приложения

### Типы ошибок
``` typescript
enum ErrorTypes {
  NETWORK_ERROR = 'Сетевая ошибка',
  API_ERROR = 'Ошибка Jira API', 
  VALIDATION_ERROR = 'Ошибка валидации',
  PERMISSION_ERROR = 'Недостаточно прав',
  NOT_FOUND_ERROR = 'Ресурс не найден',
  RATE_LIMIT_ERROR = 'Превышен лимит запросов',
  UNKNOWN_ERROR = 'Неизвестная ошибка'
}
```
### Автоматический fallback на mock данные
При критических ошибках (недоступность Jira API, проблемы с авторизацией) API автоматически переключается на mock данные:
``` typescript
const handleApiError = async (error: any, operation: string) => {
  console.warn(`⚠️ ${operation} failed, using mock data:`, error.message);
  
  // Логируем в аналитику (если настроена)
  analytics.track('api_fallback', {
    operation,
    error: error.message,
    timestamp: new Date().toISOString()
  });
  
  // Возвращаем соответствующие mock данные
  return getMockDataFor(operation);
};
```
### Примеры обработки в компонентах
``` typescript
const IssuesComponent: React.FC = () => {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await JiraAPI.getProjectIssues();
      
      if (response.success && response.data) {
        setIssues(response.data);
      } else {
        // API вернул ошибку
        setError(response.error || 'Неизвестная ошибка загрузки задач');
        
        // Можем попробовать использовать кэшированные данные
        const cachedIssues = getCachedIssues();
        if (cachedIssues) {
          setIssues(cachedIssues);
          setError(`${response.error} (показаны кэшированные данные)`);
        }
      }
    } catch (error) {
      // Неожиданная ошибка (например, компонент размонтирован)
      console.error('Unexpected error in loadIssues:', error);
      setError('Критическая ошибка приложения');
    } finally {
      setLoading(false);
    }
  };
  
  // Retry функция
  const retryLoad = () => {
    setError(null);
    loadIssues();
  };
  
  return (
    <div>
      {loading && <CircularProgress />}
      {error && (
        <Alert 
          severity="error" 
          action={<Button onClick={retryLoad}>Повторить</Button>}
        >
          {error}
        </Alert>
      )}
      {issues.length > 0 && <IssuesTable issues={issues} />}
    </div>
  );
};
```
## 🎭 Mock данные
### Структура mock данных
Mock данные предоставляют полноценную среду для разработки и тестирования:
``` typescript
// Mock проекты
const mockProjects: JiraProject[] = [
  {
    id: '10001',
    key: 'SCRUM',
    name: 'Scrum Software Development Project',
    projectTypeKey: 'software',
    description: 'Agile software development using Scrum methodology'
  },
  {
    id: '10002', 
    key: 'KANBAN',
    name: 'Kanban Board Project',
    projectTypeKey: 'software'
  },
  {
    id: '10003',
    key: 'SUPPORT',
    name: 'Customer Support Service Desk',
    projectTypeKey: 'service_desk'
  }
];

// Mock пользователи (4 активных, 1 неактивный)
const mockUsers: JiraUser[] = [
  {
    accountId: 'user1',
    displayName: 'Alex Developer',
    emailAddress: 'alex@company.com',
    avatarUrl: 'https://avatar.com/alex.png',
    active: true
  },
  // ... остальные пользователи
];

// Mock задачи с разными состояниями
const mockIssues: JiraIssue[] = [
  // Задачи без исполнителя
  {
    id: '10001',
    key: 'SCRUM-1',
    summary: 'Implement user authentication',
    status: 'To Do',
    assignee: null, // ❌ Проблема: без исполнителя
    priority: { id: '3', name: 'Medium' },
    duedate: null,
    created: '2024-01-01T09:00:00.000Z',
    updated: '2024-01-01T09:00:00.000Z'
  },
  // Задачи с низким приоритетом и близким дедлайном
  {
    id: '10002',
    key: 'SCRUM-2', 
    summary: 'Fix login page styling',
    status: 'In Progress',
    assignee: mockUsers[0],
    priority: { id: '4', name: 'Low' }, // ⚠️ Низкий приоритет
    duedate: '2024-01-10T23:59:59.000Z', // ⚠️ Близкий дедлайн
    created: '2024-01-02T10:00:00.000Z',
    updated: '2024-01-05T14:30:00.000Z'
  },
  // Обычные задачи
  {
    id: '10003',
    key: 'SCRUM-3',
    summary: 'Write unit tests for API',
    status: 'Done',
    assignee: mockUsers[1],
    priority: { id: '2', name: 'High' },
    duedate: '2024-02-01T23:59:59.000Z',
    created: '2024-01-03T11:00:00.000Z', 
    updated: '2024-01-08T16:45:00.000Z'
  }
  // ... остальные задачи
];
```
### Использование mock данных
Mock данные автоматически активируются когда:
- Jira API недоступен
- Ошибки авторизации Forge
- Режим разработки без подключения к Jira
- Docker контейнер (для демонстрации функций)
``` typescript
// Проверка режима mock данных
const isMockMode = (): boolean => {
  return !window.AP || process.env.NODE_ENV === 'development';
};

// Логирование использования mock данных
if (isMockMode()) {
  console.log('🎭 Приложение работает в режиме mock данных');
  console.log('📊 Доступно для тестирования:');
  console.log(`  • ${mockProjects.length} проектов`);
  console.log(`  • ${mockUsers.length} пользователей (${mockUsers.filter(u => u.active).length} активных)`);
  console.log(`  • ${mockIssues.length} задач`);
}
```
## 📚 Примеры использования
### Полный пример компонента с API
``` typescript
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableRow,
  Button, Chip, CircularProgress, Alert, Box
} from '@mui/material';
import { JiraAPI, JiraIssue, JiraUser, ApiResponse } from '../api';

interface IssuesTableProps {
  projectKey: string;
}

const IssuesTable: React.FC<IssuesTableProps> = ({ projectKey }) => {
  // Состояние компонента
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [users, setUsers] = useState<JiraUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [assigningIssue, setAssigningIssue] = useState<string | null>(null);

  // Загрузка данных при монтировании или смене проекта
  useEffect(() => {
    loadProjectData();
  }, [projectKey]);

  const loadProjectData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Устанавливаем активный проект
      JiraAPI.setCurrentProject(projectKey);

      // Параллельно загружаем задачи и пользователей
      const [issuesResponse, usersResponse] = await Promise.all([
        JiraAPI.getProjectIssues(),
        JiraAPI.getProjectUsers()
      ]);

      // Обработка ответа с задачами
      if (issuesResponse.success && issuesResponse.data) {
        setIssues(issuesResponse.data);
      } else {
        throw new Error(issuesResponse.error || 'Не удалось загрузить задачи');
      }

      // Обработка ответа с пользователями
      if (usersResponse.success && usersResponse.data) {
        setUsers(usersResponse.data.filter(user => user.active));
      } else {
        console.warn('Не удалось загрузить пользователей:', usersResponse.error);
        setUsers([]); // Продолжаем без пользователей
      }

    } catch (error: any) {
      console.error('Ошибка загрузки данных проекта:', error);
      setError(error.message || 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, [projectKey]);

  // Назначение исполнителя на задачу
  const assignIssue = async (issueKey: string, userId: string) => {
    try {
      setAssigningIssue(issueKey);

      // Оптимистичное обновление UI
      const assignedUser = users.find(u => u.accountId === userId);
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.key === issueKey 
            ? { ...issue, assignee: assignedUser || null }
            : issue
        )
      );

      // Выполняем назначение через API
      const response = await JiraAPI.updateIssueAssignee(issueKey, userId);

      if (!response.success) {
        // Откатываем оптимистичное обновление
        setIssues(prevIssues => 
          prevIssues.map(issue => 
            issue.key === issueKey 
              ? { ...issue, assignee: null }
              : issue
          )
        );
        throw new Error(response.error || 'Не удалось назначить исполнителя');
      }

      console.log(`✅ Задача ${issueKey} назначена пользователю ${assignedUser?.displayName}`);

    } catch (error: any) {
      console.error('Ошибка назначения исполнителя:', error);
      alert(`Ошибка: ${error.message}`);
    } finally {
      setAssigningIssue(null);
    }
  };

  // Повышение приоритета задачи
  const boostPriority = async (issueKey: string) => {
    try {
      // Оптимистичное обновление
      setIssues(prevIssues => 
        prevIssues.map(issue => 
          issue.key === issueKey 
            ? { ...issue, priority: { id: '2', name: 'High' } }
            : issue
        )
      );

      const response = await JiraAPI.updateIssuePriority(issueKey, '2');

      if (!response.success) {
        // Откатываем изменения
        await loadProjectData();
        throw new Error(response.error || 'Не удалось изменить приоритет');
      }

      console.log(`✅ Приоритет задачи ${issueKey} повышен до High`);

    } catch (error: any) {
      console.error('Ошибка изменения приоритета:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  // Массовое автоназначение
  const autoAssignAll = async () => {
    const unassignedCount = issues.filter(i => !i.assignee).length;
    
    if (!window.confirm(`Назначить исполнителей на ${unassignedCount} задач?`)) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await JiraAPI.autoAssignUnassigned();
      
      if (response.success) {
        console.log('✅ Автоназначение завершено:', response.summary);
        alert(`Успешно назначено: ${response.totalAssigned || 0} задач`);
        await loadProjectData(); // Обновляем данные
      } else {
        throw new Error(response.error || 'Ошибка автоназначения');
      }

    } catch (error: any) {
      console.error('Ошибка автоназначения:', error);
      alert(`Ошибка автоназначения: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Определение проблемных задач
  const getProblemIndicator = (issue: JiraIssue): React.ReactNode => {
    const problems: string[] = [];
    
    if (!issue.assignee) {
      problems.push('Нет исполнителя');
    }
    
    if (issue.duedate && ['4', '5'].includes(issue.priority.id)) {
      const daysUntilDue = Math.ceil(
        (new Date(issue.duedate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilDue <= 7) {
        problems.push('Низкий приоритет + близкий дедлайн');
      }
    }

    if (problems.length === 0) return null;

    return (
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {!issue.assignee && <span style={{ color: 'red' }}>🔴</span>}
        {problems.includes('Низкий приоритет + близкий дедлайн') && 
          <span style={{ color: 'orange' }}>🟡</span>
        }
      </Box>
    );
  };

  // Рендер состояний загрузки и ошибок
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={loadProjectData}>
            Повторить
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  const unassignedCount = issues.filter(i => !i.assignee).length;
  const availableUsers = users.length;

  return (
    <Box>
      {/* Панель управления */}
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Chip 
            label={`Всего задач: ${issues.length}`} 
            color="primary" 
            variant="outlined" 
          />
          <Chip 
            label={`Без исполнителя: ${unassignedCount}`} 
            color={unassignedCount > 0 ? "error" : "success"}
            sx={{ ml: 1 }}
          />
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          onClick={autoAssignAll}
          disabled={unassignedCount === 0 || availableUsers === 0}
        >
          Auto-assign ({unassignedCount})
        </Button>
      </Box>

      {/* Таблица задач */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Key</TableCell>
            <TableCell>Summary</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Assignee</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {issues.map((issue) => (
            <TableRow 
              key={issue.id}
              sx={{ 
                backgroundColor: !issue.assignee ? 'rgba(255,0,0,0.1)' : 'inherit'
              }}
            >
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  {getProblemIndicator(issue)}
                  {issue.key}
                </Box>
              </TableCell>
              <TableCell>{issue.summary}</TableCell>
              <TableCell>
                <Chip label={issue.status} size="small" />
              </TableCell>
              <TableCell>
                {issue.assignee ? issue.assignee.displayName : 'Не назначен'}
              </TableCell>
              <TableCell>
                <Chip 
                  label={issue.priority.name} 
                  size="small"
                  color={
                    ['1','2'].includes(issue.priority.id) ? 'error' :
                    issue.priority.id === '3' ? 'warning' : 'default'
                  }
                />
              </TableCell>
              <TableCell>
                {!issue.assignee && users.length > 0 && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => assignIssue(issue.key, users[0].accountId)}
                    disabled={assigningIssue === issue.key}
                  >
                    {assigningIssue === issue.key ? 'Назначаем...' : 'Fix'}
                  </Button>
                )}
                
                {issue.duedate && ['4', '5'].includes(issue.priority.id) && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    onClick={() => boostPriority(issue.key)}
                    sx={{ ml: 1 }}
                  >
                    Boost Priority
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {issues.length === 0 && (
        <Box textAlign="center" py={4}>
          <Alert severity="info">
            В проекте {projectKey} пока нет задач
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default IssuesTable;
```
## 🎯 Лучшие практики
### 1. Всегда проверяйте response.success
``` typescript
// ❌ Неправильно
const issues = await JiraAPI.getProjectIssues();
setIssues(issues.data); // data может быть undefined!

// ✅ Правильно  
const response = await JiraAPI.getProjectIssues();
if (response.success && response.data) {
  setIssues(response.data);
} else {
  handleError(response.error);
}
```
### 2. Используйте TypeScript для автодополнения
``` typescript
// TypeScript автоматически знает типы
const issue: JiraIssue = response.data[0];
issue.summary; // ✅ string
issue.assignee?.displayName; // ✅ string | undefined
issue.priority.id; // ✅ string
```
### 3. Обрабатывайте состояния loading
``` typescript
const [loading, setLoading] = useState(false);

const performAction = async () => {
  try {
    setLoading(true);
    const response = await JiraAPI.someOperation();
    // обработка результата
  } finally {
    setLoading(false); // Всегда сбрасываем loading
  }
};
```
### 4. Используйте оптимистичные обновления
``` typescript
const assignUser = async (issueKey: string, user: JiraUser) => {
  // 1. Сначала обновляем UI
  updateIssueInState(issueKey, { assignee: user });
  
  try {
    // 2. Затем выполняем API запрос
    const response = await JiraAPI.updateIssueAssignee(issueKey, user.accountId);
    
    if (!response.success) {
      // 3. Откатываем при ошибке
      updateIssueInState(issueKey, { assignee: null });
      throw new Error(response.error);
    }
  } catch (error) {
    // Обработка ошибки
    showErrorMessage(error.message);
  }
};
```
### 5. Логируйте операции для отладки
``` typescript
// API автоматически логирует операции с префиксами:
console.log('🚀 Initializing API...'); // инициализация
console.log('📡 API Request: getProjectIssues'); // запросы
console.log('✅ Operation completed successfully'); // успех
console.log('❌ Operation failed:', error); // ошибки
console.log('🎭 Using mock data for development'); // mock режим
```
### 6. Группируйте связанные API вызовы
``` typescript
// ❌ Последовательные запросы
const issues = await JiraAPI.getProjectIssues();
const users = await JiraAPI.getProjectUsers();

// ✅ Параллельные запросы
const [issuesResponse, usersResponse] = await Promise.all([
  JiraAPI.getProjectIssues(),
  JiraAPI.getProjectUsers()
]);
```
### 7. Кэшируйте данные когда это возможно
``` typescript
const cache = new Map<string, { data: any, timestamp: number }>();

const getCachedOrFetch = async (key: string, fetcher: () => Promise<any>) => {
  const cached = cache.get(key);
  const CACHE_TTL = 5 * 60 * 1000; // 5 минут
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};
```
## 📞 Техническая поддержка
При возникновении проблем с API:
1. **Проверьте консоль браузера** - все операции логируются
2. **Убедитесь в правильности параметров** - TypeScript поможет с типами
3. **Проверьте права доступа** - некоторые операции требуют специальных разрешений
4. **Тестируйте с mock данными** - для изоляции проблем от Jira API

**Полезные команды для отладки:**
``` javascript
// В консоли браузера
JiraAPI.getCurrentProject(); // текущий проект
JiraAPI.initialize(); // переинициализация
localStorage.clear(); // очистка кэша
```
