FROM node:latest AS builder

WORKDIR /usr/src/app

COPY package*.json ./

COPY tsconfig.json ./

RUN npm install

COPY . .

RUN npm run build  # compiles to /usr/src/app/build

# Stage 2: Production
FROM node:latest AS runner

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./
RUN npm install
# Bundle app source
COPY --from=builder /usr/src/app/dist ./

EXPOSE 3000
CMD [ "npm", "start" ]