FROM node:20-alpine

WORKDIR /bot

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV DATA_DIR=/app/data
RUN mkdir -p /app/data/backups && chmod +x /bot/docker-entrypoint.sh

ENTRYPOINT ["/bot/docker-entrypoint.sh"]
CMD ["node", "/bot/index.js"]
