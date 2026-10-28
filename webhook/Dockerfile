FROM node:24-trixie

# Chromium + nötige Abhängigkeiten für Puppeteer/Critical
RUN apt update
RUN apt install \
    git \
    bash \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

RUN git config --global --add safe.directory /workspace

WORKDIR /app
COPY package.json .
RUN npm install
RUN npx playwright install --with-deps chromium

COPY server.js .

CMD ["node", "server.js"]