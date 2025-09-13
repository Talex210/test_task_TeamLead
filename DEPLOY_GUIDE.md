# 🚀 Полный гид по деплою Jira Project Assistant

## 📋 Содержание

- [Быстрый старт](#быстрый-старт)
- [Docker развертывание](#docker-развертывание)
- [Деплой в Jira Cloud](#деплой-в-jira-cloud)
- [Режимы запуска](#режимы-запуска)
- [Решение проблем](#решение-проблем)
- [Мониторинг и отладка](#мониторинг-и-отладка)

## ⚡ Быстрый старт

### Самый быстрый способ - Docker

```bash
# Клонирование и запуск одной командой
git clone <repository> && cd test_task_TeamLead
docker-compose up --build

# Приложение доступно на http://localhost:8080
```
```
### Традиционный деплой в Jira
``` bash
# Установка зависимостей
npm install && cd static/ui && npm install && cd ../..

# Сборка и деплой
npm run deploy
```
## 🐳 Docker развертывание
### Структура Docker настройки
``` dockerfile
# Dockerfile - многоэтапная сборка
FROM node:18-alpine AS build     # Стадия сборки
FROM nginx:1.25-alpine          # Стадия production
```
### Команды Docker
``` bash
# Сборка и запуск через Compose (рекомендуется)
docker-compose up --build

# Только пересборка без запуска
docker-compose build

# Запуск в фоновом режиме
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down

# Полная очистка (удаление контейнеров и образов)
docker-compose down --rmi all --volumes
```
### Ручная сборка Docker образа
``` bash
# Сборка образа
docker build -t jira-assistant .

# Запуск контейнера
docker run -p 8080:80 --name jira-app jira-assistant

# Запуск в фоновом режиме
docker run -d -p 8080:80 --name jira-app jira-assistant

# Просмотр логов
docker logs -f jira-app

# Остановка
docker stop jira-app && docker rm jira-app
```
### Docker конфигурация
**docker-compose.yml:**
``` yaml
version: '3.9'
services:
  ui:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:80"        # Приложение на порту 8080
    restart: unless-stopped
    environment:
      - NODE_ENV=production
```
**Dockerfile особенности:**
- ✅ Многоэтапная сборка для оптимизации размера
- ✅ Node.js 18 Alpine для быстрой сборки
- ✅ Nginx Alpine для эффективной раздачи статики
- ✅ Автоматическая настройка SPA роутинга
- ✅ Оптимизированные слои кэширования

### Преимущества Docker версии
- 🚀 **Мгновенный запуск** - без установки Node.js и зависимостей
- 🔒 **Изолированное окружение** - никаких конфликтов с системой
- 📦 **Готовые mock данные** - для демонстрации всех функций
- 🌐 **Production-like среда** - Nginx + оптимизированная сборка
- 🔄 **Автоперезапуск** - автоматическое восстановление после ошибок

## 🌐 Деплой в Jira Cloud
### Предварительные требования
1. **Atlassian Developer Account** - зарегистрированный аккаунт разработчика
2. **Jira Cloud Instance** - доступ к Jira Cloud инстансу
3. **@forge/cli** - установленная и настроенная Forge CLI
4. **Node.js 18+** - для локальной разработки

### Пошаговая инструкция
#### Шаг 1: Установка Forge CLI
``` bash
# Установка глобально
npm install -g @forge/cli

# Проверка версии
forge --version

# Первый запуск - логин в Atlassian
forge login
```
#### Шаг 2: Подготовка проекта
``` bash
# Клонирование проекта
git clone <repository>
cd test_task_TeamLead

# Установка зависимостей
npm install

# Установка UI зависимостей
cd static/ui
npm install
cd ../..
```
#### Шаг 3: Конфигурация манифеста
Проверьте настройки в : `manifest.yml`
``` yaml
modules:
  jira:projectPage:
    - key: jira-project-assistant-project-page
      resource: main
      title: 🚀 Team Assistant

resources:
  - key: main
    path: static/ui/build    # Путь к собранным файлам

permissions:
  scopes:
    - read:jira-work         # Чтение задач и проектов
    - write:jira-work        # Редактирование задач
    - read:jira-user         # Информация о пользователях

app:
  runtime:
    name: nodejs20.x         # Версия Node.js для Forge
```
#### Шаг 4: Сборка и деплой
``` bash
# Полный деплой (сборка + загрузка)
npm run deploy

# Альтернативные команды
npm run build              # Только сборка UI
npm run deploy-verbose     # Деплой с подробными логами
npm run quick-deploy       # Деплой без пересборки UI
```
#### Шаг 5: Установка в Jira
После успешного деплоя:
1. Откройте любой проект в Jira Cloud
2. Найдите в боковой панели проекта **"🚀 Team Assistant"**
3. При первом запуске может потребоваться подтверждение разрешений

### Скрипты для деплоя
``` json
{
  "scripts": {
    "dev": "forge tunnel",                    // Разработка с live reload
    "build": "cd static/ui && npm run build", // Только сборка UI
    "deploy": "npm run build && forge deploy --no-verify",
    "deploy-verbose": "npm run build && forge deploy --no-verify --verbose",
    "quick-deploy": "forge deploy --no-verify",
    "clean-build": "cd static/ui && rm -rf build && npm run build",
    "clean-all": "cd static/ui && rm -rf build node_modules && npm install && npm run build"
  }
}
```
## 🔧 Режимы запуска
### 1. Docker режим (рекомендуется для демо)
``` bash

docker-compose up --build
# → http://localhost:8080
```
**Особенности:**
- ✅ Mock данные для всех функций
- ✅ Полная изоляция от системы
- ✅ Готов к демонстрации за 30 секунд
- ✅ Не требует настройки Jira

### 2. Forge Development режим
``` bash

npm run dev

# → Forge tunnel URL (например, https://abc123.ngrok.io)
```
**Особенности:**
- ✅ Live reload изменений
- ✅ Реальные данные Jira
- ✅ Полная интеграция с Jira UI
- ⚠️ Требует настройку Forge CLI

### 3. Production режим в Jira Cloud
``` bash

npm run deploy

# → Приложение доступно в Jira проектах
```
**Особенности:**
- ✅ Готов для реального использования
- ✅ Полная интеграция с Jira
- ✅ Оптимизированная производительность
- ⚠️ Требует права администратора Jira

### Сравнение режимов

| Режим | Скорость запуска | Данные | Интеграция с Jira | Использование |
| --- | --- | --- | --- | --- |
| Docker | ⚡ 30 сек | 🎭 Mock | ❌ Нет | Демо, разработка UI |
| Development | 🔶 2-5 мин | ✅ Реальные | ✅ Полная | Разработка функций |
| Production | 🔶 2-5 мин | ✅ Реальные | ✅ Полная | Продакшн использование |
## 🛠️ Решение проблем
### Проблемы Docker
#### Порт 8080 занят
``` bash
# Проверка занятого порта
lsof -i :8080

# Использование другого порта
docker run -p 8081:80 jira-assistant

# Или в docker-compose.yml изменить на "8081:80"
```
#### Ошибки сборки
``` bash
# Полная пересборка без кэша
docker-compose build --no-cache

# Очистка Docker
docker system prune -a
docker volume prune
```
#### Проблемы с правами (Linux/Mac)
``` bash
# Запуск с sudo если нужно
sudo docker-compose up --build

# Или добавить пользователя в группу docker
sudo usermod -aG docker $USER
# Затем перелогиниться
```
### Проблемы Forge деплоя
#### CLI версия не поддерживается
``` bash
# Переустановка CLI
npm uninstall -g @forge/cli
npm install -g @forge/cli@latest

# Проверка версии
forge --version
```
#### Ошибка авторизации
``` bash
# Повторный логин
forge login

# Проверка настроек
forge whoami
```
#### Файлы не обновляются в Jira
``` bash
# Очистка и пересборка
npm run clean-build
npm run deploy

# Проверка структуры build директории
ls -la static/ui/build/
```
#### Ошибки манифеста
``` yaml
# Проверьте корректность YAML синтаксиса
# Используйте валидатор: https://yaml-lint.com

# Популярные ошибки:
app:
  runtime:
    name: nodejs20.x  # Правильно (не nodejs20 или nodejs18.x)

permissions:
  scopes:
    - read:jira-work   # С дефисом, не подчеркивание
```
### Проблемы сборки UI
#### Ошибки TypeScript
``` bash
# Проверка типов без сборки
cd static/ui
npx tsc --noEmit

# Исправление типов и повторная сборка
npm run build
```
#### Ошибки зависимостей
``` bash
# Переустановка зависимостей
cd static/ui
rm -rf node_modules package-lock.json
npm install
```
#### Проблемы с Vite
``` bash
# Очистка кэша Vite
cd static/ui
rm -rf .vite
npm run build
```
### Общие проблемы
#### Медленная работа
- ✅ Используйте SSD диск для Docker
- ✅ Увеличьте memory_limit для Docker
- ✅ Закройте неиспользуемые приложения

#### Ошибки в браузере
- ✅ Откройте DevTools (F12) → Console
- ✅ Проверьте Network вкладку на ошибки API
- ✅ Очистите кэш браузера (Ctrl+Shift+R)

## 📊 Мониторинг и отладка
### Docker логи
``` bash
# Просмотр всех логов
docker-compose logs

# Логи конкретного сервиса
docker-compose logs ui

# Следить за логами в реальном времени
docker-compose logs -f ui

# Последние 50 строк логов
docker-compose logs --tail=50 ui
```
### Forge логи
``` bash
# Логи деплоя
forge deploy --no-verify --verbose

# Логи tunnel режима
forge tunnel --verbose

# Логи установки
forge install --verbose
```
### Отладка в браузере
**Docker режим ([http://localhost:8080](http://localhost:8080)):**
``` javascript
// В консоли браузера
console.log('🎭 Mock режим активен');

// Проверка доступных данных
window.mockData; // Mock данные приложения

// Логи приложения
// 🚀 - инициализация
// 📡 - API запросы  
// ✅ - успешные операции
// ❌ - ошибки
// 🎭 - использование mock данных
```
**Jira режим:**
``` javascript
// Проверка Forge контекста
window.AP; // Atlassian Connect объект

// Проверка текущего контекста
AP.context.getContext(); // Promise с информацией о проекте

// Перезагрузка приложения
window.location.reload();
```
### Производительность
**Метрики сборки:**
``` bash
# Размер Docker образа
docker images jira-assistant

# Время сборки UI
time npm run build

# Анализ bundle размера
cd static/ui
npm run build -- --analyze
```
**Метрики запуска:**
``` bash
# Время запуска Docker
time docker-compose up

# Использование ресурсов
docker stats jira-app

# Проверка портов
netstat -tlnp | grep :8080
```
## 🎯 Чек-лист успешного деплоя
### Docker развертывание ✅
- Git репозиторий склонирован
- Docker и Docker Compose установлены
- Порт 8080 свободен
- выполнена успешно `docker-compose up --build`
- [http://localhost:8080](http://localhost:8080) открывается в браузере
- Mock данные загружаются (3 проекта, задачи, пользователи)
- Все функции работают (Fix кнопки, автоназначение, смена проектов)

### Jira Cloud деплой ✅
- Atlassian Developer Account создан
- @forge/cli установлен и настроен (`forge login`)
- Node.js зависимости установлены
- UI зависимости установлены () `cd static/ui && npm install`
- `npm run deploy` выполнен успешно
- Приложение установлено в Jira (`forge install`)
- "🚀 Team Assistant" появился в боковой панели проекта
- Реальные данные Jira загружаются
- Все функции работают с реальными задачами

### Функциональное тестирование ✅
- Переключение между проектами работает
- Таблица задач отображается корректно
- Цветовые индикаторы проблем показываются
- Fix кнопки открывают соответствующие модальные окна
- Назначение исполнителей работает
- Изменение приоритетов работает
- Автоназначение выполняется корректно
- Статистика проекта обновляется
- Карточки участников отображаются
- Система активности участников работает

## 🚀 Готово к production!
Приложение полностью готово для использования в любом из режимов:
- ✅ **Docker** - для быстрого тестирования и демонстрации
- ✅ **Forge Development** - для разработки новых функций
- ✅ **Jira Cloud Production** - для реального использования в команде

**Все требования тестового задания выполнены и протестированы!** 🎯
## 👨‍💻 Поддержка
При возникновении проблем:
1. Проверьте [раздел решения проблем](#%D1%80%D0%B5%D1%88%D0%B5%D0%BD%D0%B8%D0%B5-%D0%BF%D1%80%D0%BE%D0%B1%D0%BB%D0%B5%D0%BC)
2. Изучите логи в соответствующем разделе
3. Откройте DevTools браузера для дополнительной информации
4. Используйте чек-лист для проверки всех шагов

**Happy deploying!** 🚀
