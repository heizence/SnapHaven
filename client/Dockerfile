FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG TARGET_ENV=dev
RUN npm run build:${TARGET_ENV}

FROM node:20-alpine
WORKDIR /app

ARG TARGET_ENV=dev
ENV NODE_ENV=${TARGET_ENV}

COPY --from=builder /app ./

EXPOSE 3000

CMD ["npm", "start"]