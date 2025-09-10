FROM node:18-alpine

WORKDIR /app

# Установка Forge CLI
RUN npm install -g @forge/cli

# Копирование package.json и установка зависимостей
COPY package*.json ./
RUN npm install

# Копирование исходного кода
COPY . .

# Сборка приложения
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "dev"]