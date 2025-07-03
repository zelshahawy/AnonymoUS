FROM node:18-alpine

# install pnpm globally so the pnpm CLI is available
RUN npm install -g pnpm@latest

WORKDIR /app

COPY package*.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 3000
CMD ["pnpm", "run", "start"]
