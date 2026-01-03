FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG TARGET_ENV
RUN npm run build:${TARGET_ENV}

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD npm run start:${TARGET_ENV}