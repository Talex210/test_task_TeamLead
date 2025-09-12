# 🚀 Гид по деплою Jira Project Assistant

## Быстрый деплой (обычный случай)
```bash
npm run deploy
```

## Если есть проблемы с билдом
```bash
npm run clean-build
npm run deploy
```

## Если есть серьезные проблемы
```bash
npm run clean-all
npm run deploy
```

## Деплой с подробным выводом (для отладки)
```bash
npm run deploy-verbose
```

## Быстрый деплой без пересборки UI
```bash
npm run quick-deploy
```

## Проверка билда без деплоя
```bash
npm run check-build
```

## Решение типичных проблем

### 1. Ошибка версии Node.js в манифесте
- Убедитесь что в `manifest.yml` указано `nodejs20.x` или `nodejs22.x`

### 2. Ошибка "CLI version not supported"
```bash
npm uninstall -g @forge/cli
npm install -g @forge/cli
```

### 3. Файлы не обновляются на сайте
- Проверьте что билд создает файлы в `static/ui/build/`
- Убедитесь что в манифесте путь `static/ui/build`
- Попробуйте `npm run clean-build`

### 4. Проблемы с кэшем
```bash
npm run clean-all
```

## Структура проекта для деплоя
```
├── manifest.yml          # Конфигурация Forge (nodejs20.x)
├── package.json          # Скрипты деплоя
└── static/ui/
    ├── src/              # Исходный код React
    ├── build/            # Собранные файлы (создается автоматически)
    ├── package.json      # Конфигурация UI
    └── vite.config.js    # Конфигурация сборки
```

## Что происходит при деплое
1. `npm run build` - собирает React приложение в `static/ui/build/`
2. `forge deploy` - упаковывает и загружает приложение в Atlassian
3. Приложение становится доступно в Jira

## Проверка результата
После успешного деплоя:
1. Откройте любой проект в Jira
2. Найдите приложение "🚀 Team Assistant" в боковой панели
3. Проверьте что отображаются ваши изменения

✅ **Деплой настроен и работает стабильно!**