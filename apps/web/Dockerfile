FROM node:20-alpine
WORKDIR /app
# Install pnpm since the project seems to have pnpm-lock.yaml
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
EXPOSE 3000
CMD ["pnpm", "start"]
