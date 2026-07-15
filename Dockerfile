FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.29-alpine
COPY deploy/nginx/default.conf.template /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/sayara-hub-FE/browser /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1
