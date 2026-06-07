FROM node:20-alpine

WORKDIR /bot

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV DATA_DIR=/app/data
RUN mkdir -p /app/data/backups

CMD ["node", "/bot/index.js"]
