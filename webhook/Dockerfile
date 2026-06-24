FROM node:20-alpine

RUN apk add --no-cache docker-cli git bash

WORKDIR /app
COPY package.json .
RUN npm install

COPY server.js .

CMD ["node", "server.js"]