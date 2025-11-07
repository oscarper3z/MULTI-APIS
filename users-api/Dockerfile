FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# Cambiar puerto al que escucha la app
ENV PORT=80 SERVICE_NAME=users-api
EXPOSE 80

CMD ["node", "src/app.js"]

