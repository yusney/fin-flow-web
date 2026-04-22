FROM node:22-alpine AS build

ARG API_URL=https://api.finflow.donduque.dev/api
ENV API_URL=$API_URL

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

RUN find /app/dist/fin-flow-angular/browser -type f \( -name "*.js" -o -name "*.mjs" \) \
    -exec sed -i "s|__API_URL__|${API_URL}|g" {} +

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/fin-flow-angular/browser /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]