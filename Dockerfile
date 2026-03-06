FROM node:22-alpine
WORKDIR /home/node/app

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD [ "sh", "-c", "npm run migration:run && npm run start:prod" ]