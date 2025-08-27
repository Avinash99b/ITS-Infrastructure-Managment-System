FROM node:latest as builder

WORKDIR /app

COPY package.json package-lock.json ./

COPY . .

RUN npm install

RUN npx tsc

RUN npm run build

FROM node:latest as runner

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist/next.config.js ./next.config.js

CMD ["npm", "start"]

EXPOSE 3000