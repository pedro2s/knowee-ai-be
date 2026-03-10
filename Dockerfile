FROM node:22-alpine
WORKDIR /home/node/app

COPY package*.json ./
RUN apk add --no-cache zip
RUN npm ci
COPY . .
RUN npm run build
CMD [ "sh", "-c", "npm run migration:run && npm run db:seed && npm run start:prod" ]
