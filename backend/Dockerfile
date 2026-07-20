FROM node:20-alpine

RUN npm install -g pnpm@11.1.2

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]