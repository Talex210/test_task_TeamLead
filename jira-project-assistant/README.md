# Jira Project Assistant

Приложение-помощник для управления проектом в Jira: показывает проблемные задачи и может автоматически исправлять некоторые из них.

## Технологии
- TypeScript
- React (функциональные компоненты)
- Material-UI (MUI)
- Atlassian Forge
- Zustand (state management)
- Docker

## Установка и запуск

### Предварительные требования
1. Node.js 18+
2. Docker и Docker Compose
3. Atlassian Developer Account

### Настройка Forge приложения

1. Установите Forge CLI:
```bash
npm install -g @forge/cli
```

2. Войдите в Atlassian:
```bash
forge login
```

3. Создайте новое приложение:
```bash
forge create
```

4. Установите зависимости:
```bash
npm install
```

5. Деплой приложения:
```bash
forge deploy
```

6. Установите приложение в Jira:
```bash
forge install
```

### Запуск с Docker

```bash
docker-compose up --build
```

### Локальная разработка

```bash
npm install
npm run dev
```

## Структура проекта

```
src/
├── components/          # React компоненты
├── stores/             # Zustand stores
├── types/              # TypeScript типы
├── services/           # API сервисы
├── utils/              # Утилиты
└── App.tsx             # Главный компонент
```

## API и разрешения

Приложение использует Jira V3 API со следующими разрешениями:
- `read:jira-work` - чтение задач и проектов
- `write:jira-work` - обновление задач
- `read:jira-user` - чтение информации о пользователях