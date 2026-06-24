FROM node:22-alpine

RUN apk add --no-cache git bash \
  && git config --global --add safe.directory /workspace

WORKDIR /app
COPY package.json .
RUN npm install
COPY server.js .

CMD ["node", "server.js"]