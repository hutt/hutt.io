FROM node:22-alpine

# Chromium + nötige Abhängigkeiten für Puppeteer/Critical
RUN apk add --no-cache \
    git \
    bash \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
  && git config --global --add safe.directory /workspace

# Puppeteer soll das System-Chromium nutzen, nicht selbst eines herunterladen
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY package.json .
RUN npm install

COPY server.js .

CMD ["node", "server.js"]