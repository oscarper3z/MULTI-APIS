FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# Cambiar puerto al que escucha la app
ENV PORT=80 SERVICE_NAME=products-api
EXPOSE 4002

CMD ["node", "src/index.js"]
