FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

RUN npm run build

FROM node:20-alpine
WORKDIR /app

ARG TARGET_ENV=dev
ENV NODE_ENV=${TARGET_ENV}

COPY --from=builder /app ./

EXPOSE 8001

CMD ["npm", "start"]