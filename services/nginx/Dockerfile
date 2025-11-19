FROM node:20 AS build
WORKDIR /app
COPY services/frontend/package*.json ./
RUN npm install
COPY services/frontend ./
RUN npm run build

FROM nginx:alpine
COPY services/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]