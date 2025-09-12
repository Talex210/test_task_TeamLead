# 📚 API Документация - Jira Project Assistant

## Обзор

Jira Project Assistant предоставляет TypeScript API для работы с Jira через Atlassian Forge. Все API методы полностью типизированы и включают обработку ошибок.

## Основные типы

### JiraIssue
```typescript
interface JiraIssue {
  id: string;                    // Уникальный ID задачи
  key: string;                   // Ключ задачи (например, "SCRUM-1")
  summary: string;               // Название задачи
  status: string;                // Статус задачи
  assignee: JiraUser | null;     // Назначенный исполнитель или null
  priority: {
    name: string;                // Название приоритета
    id: string;                  // ID приоритета
  };
  duedate: string | null;        // Дедлайн в ISO формате или null
  created: string;               // Дата создания в ISO формате
  updated: string;               // Дата обновления в ISO формате
}
```

### JiraUser
```typescript
interface JiraUser {
  accountId: string;             // Уникальный ID пользователя
  displayName: string;           // Отображаемое имя
  emailAddress?: string;         // Email (опционально)
  avatarUrl: string;             // URL аватара
  active: boolean;               // Активен ли пользователь
}
```

### JiraProject
```typescript
interface JiraProject {
  id: string;                    // Уникальный ID проекта
  key: string;                   // Ключ проекта (например, "SCRUM")
  name: string;                  // Название проекта
  projectTypeKey: string;        // Тип проекта
}
```

### ApiResponse<T>
```typescript
interface ApiResponse<T> {
  success: boolean;              // Успешность операции
  data?: T;                      // Данные ответа (если успешно)
  error?: string;                // Сообщение об ошибке (если неуспешно)
  message?: string;              // Дополнительное сообщение
}
```

## API Методы

### JiraAPI.initialize()
Инициализирует API и получает контекст проекта.

```typescript
async initialize(): Promise<boolean>
```

**Возвращает:** `Promise<boolean>` - true при успешной инициализации

**Пример:**
```typescript
await JiraAPI.initialize();
```

### JiraAPI.getProjects()
Получает список всех доступных проектов.

```typescript
async getProjects(): Promise<ApiResponse<JiraProject[]>>
```

**Возвращает:** `Promise<ApiResponse<JiraProject[]>>`

**Пример:**
```typescript
const response = await JiraAPI.getProjects();
if (response.success && response.data) {
  console.log('Проекты:', response.data);
}
```

### JiraAPI.setCurrentProject()
Устанавливает текущий проект для работы.

```typescript
setCurrentProject(projectKey: string): string
```

**Параметры:**
- `projectKey: string` - Ключ проекта (например, "SCRUM")

**Возвращает:** `string` - Установленный ключ проекта

**Пример:**
```typescript
JiraAPI.setCurrentProject('SCRUM');
```

### JiraAPI.getCurrentProject()
Получает ключ текущего проекта.

```typescript
getCurrentProject(): string | null
```

**Возвращает:** `string | null` - Ключ текущего проекта или null

### JiraAPI.getProjectIssues()
Получает все задачи текущего проекта.

```typescript
async getProjectIssues(): Promise<ProjectIssuesResponse>
```

**Возвращает:** `Promise<ProjectIssuesResponse>`

```typescript
interface ProjectIssuesResponse extends ApiResponse<JiraIssue[]> {
  projectKey?: string;           // Ключ проекта, из которого получены задачи
}
```

**Пример:**
```typescript
const response = await JiraAPI.getProjectIssues();
if (response.success && response.data) {
  console.log(`Получено ${response.data.length} задач из проекта ${response.projectKey}`);
}
```

### JiraAPI.getProjectUsers()
Получает всех пользователей, которые могут быть назначены на задачи в проекте.

```typescript
async getProjectUsers(): Promise<ApiResponse<JiraUser[]>>
```

**Возвращает:** `Promise<ApiResponse<JiraUser[]>>`

**Пример:**
```typescript
const response = await JiraAPI.getProjectUsers();
if (response.success && response.data) {
  const activeUsers = response.data.filter(user => user.active);
  console.log(`Активных пользователей: ${activeUsers.length}`);
}
```

### JiraAPI.updateIssueAssignee()
Назначает исполнителя на задачу.

```typescript
async updateIssueAssignee(issueKey: string, accountId: string): Promise<ApiResponse<void>>
```

**Параметры:**
- `issueKey: string` - Ключ задачи (например, "SCRUM-1")
- `accountId: string` - ID аккаунта пользователя

**Возвращает:** `Promise<ApiResponse<void>>`

**Пример:**
```typescript
const response = await JiraAPI.updateIssueAssignee('SCRUM-1', 'user123');
if (response.success) {
  console.log('Исполнитель назначен успешно');
} else {
  console.error('Ошибка:', response.error);
}
```

### JiraAPI.updateIssuePriority()
Обновляет приоритет задачи.

```typescript
async updateIssuePriority(issueKey: string, priorityId: string): Promise<ApiResponse<void>>
```

**Параметры:**
- `issueKey: string` - Ключ задачи
- `priorityId: string` - ID приоритета ("1" = Highest, "2" = High, "3" = Medium, "4" = Low, "5" = Lowest)

**Возвращает:** `Promise<ApiResponse<void>>`

**Пример:**
```typescript
// Повысить приоритет до High
const response = await JiraAPI.updateIssuePriority('SCRUM-1', '2');
if (response.success) {
  console.log('Приоритет обновлен');
}
```

### JiraAPI.autoAssignUnassigned()
Автоматически назначает исполнителей на все задачи без исполнителя.

```typescript
async autoAssignUnassigned(): Promise<AutoAssignResponse>
```

**Возвращает:** `Promise<AutoAssignResponse>`

```typescript
interface AutoAssignResponse extends ApiResponse<AutoAssignResult[]> {
  results?: AutoAssignResult[];  // Результаты назначения для каждой задачи
  summary?: string;              // Краткое резюме операции
}

interface AutoAssignResult {
  issueKey: string;              // Ключ задачи
  assignedTo?: string;           // Имя назначенного пользователя
  success: boolean;              // Успешность назначения
  error?: string;                // Ошибка (если неуспешно)
}
```

**Логика назначения:**
- Назначает только активным пользователям (active: true)
- Учитывает загрузку: максимум 2 задачи на пользователя
- Выбирает исполнителя случайно из доступных

**Пример:**
```typescript
const response = await JiraAPI.autoAssignUnassigned();
if (response.success && response.results) {
  const successCount = response.results.filter(r => r.success).length;
  console.log(`Назначено ${successCount} задач`);
  console.log('Резюме:', response.summary);
}
```

## Обработка ошибок

Все API методы используют единообразную обработку ошибок:

1. **Сетевые ошибки** - автоматически перехватываются и возвращают mock данные
2. **Ошибки валидации** - возвращаются в поле `error` ответа
3. **Неожиданные ошибки** - логируются в консоль и возвращают fallback ответ

**Пример обработки:**
```typescript
try {
  const response = await JiraAPI.getProjectIssues();
  
  if (response.success && response.data) {
    // Успешный случай
    setIssues(response.data);
  } else {
    // Ошибка API
    console.error('API Error:', response.error);
    setError(response.error || 'Неизвестная ошибка');
  }
} catch (error) {
  // Неожиданная ошибка
  console.error('Unexpected error:', error);
  setError('Критическая ошибка приложения');
}
```

## Mock данные

В режиме разработки API автоматически использует mock данные при недоступности реального Jira API. Mock данные включают:

- 10 тестовых задач с разными статусами и приоритетами
- 5 тестовых пользователей (4 активных, 1 неактивный)
- 3 тестовых проекта (SCRUM, KANBAN, SUPPORT)

## Типы компонентов

### ProjectStats
```typescript
interface ProjectStats {
  totalIssues: number;           // Общее количество задач
  unassignedIssues: number;      // Задачи без исполнителя
  problemIssues: number;         // Проблемные задачи
  activeUsers: number;           // Активные пользователи
}
```

### Modal Props
```typescript
interface ModalProps {
  show: boolean;                 // Показывать ли модальное окно
  onClose: () => void;           // Функция закрытия
}

interface AssignModalProps extends ModalProps {
  issue: JiraIssue | null;       // Задача для назначения
  users: JiraUser[];             // Список пользователей
  issues: JiraIssue[];           // Все задачи (для подсчета загрузки)
  onAssign: (accountId: string) => Promise<void>; // Функция назначения
}
```

## Лучшие практики

1. **Всегда проверяйте response.success** перед использованием данных
2. **Используйте TypeScript** для автодополнения и проверки типов
3. **Обрабатывайте состояния loading** для лучшего UX
4. **Логируйте ошибки** для отладки
5. **Используйте оптимистичные обновления** для быстрого отклика UI

## Примеры использования

### Загрузка и отображение задач
```typescript
const [issues, setIssues] = useState<JiraIssue[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);

const loadIssues = async () => {
  try {
    setLoading(true);
    const response = await JiraAPI.getProjectIssues();
    
    if (response.success && response.data) {
      setIssues(response.data);
    } else {
      setError(response.error || 'Ошибка загрузки задач');
    }
  } catch (err) {
    setError('Критическая ошибка');
  } finally {
    setLoading(false);
  }
};
```

### Назначение исполнителя с обновлением UI
```typescript
const assignUser = async (issueKey: string, userId: string) => {
  // Оптимистичное обновление
  const updatedIssues = issues.map(issue => 
    issue.key === issueKey 
      ? { ...issue, assignee: users.find(u => u.accountId === userId) || null }
      : issue
  );
  setIssues(updatedIssues);

  try {
    const response = await JiraAPI.updateIssueAssignee(issueKey, userId);
    
    if (!response.success) {
      // Откатываем изменения при ошибке
      await loadIssues();
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Ошибка назначения:', error);
    // UI уже откатился через loadIssues()
  }
};
```