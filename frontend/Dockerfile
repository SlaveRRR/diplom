FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

ARG VITE_API
ARG VITE_BACKEND_URL
ARG VITE_SUPPORT_EMAIL

ENV VITE_API=$VITE_API
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_SUPPORT_EMAIL=$VITE_SUPPORT_EMAIL

RUN yarn build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
