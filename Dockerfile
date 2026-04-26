FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

ARG GIT_SHA=dev
RUN sed -i "s/version: '0.0.0'/version: '${GIT_SHA}'/" src/environments/environment.prod.ts

RUN pnpm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/99-inject-config.sh

RUN chmod +x /docker-entrypoint.d/99-inject-config.sh

COPY --from=build /app/dist/fin-flow-angular/browser /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]