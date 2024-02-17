FROM node:alpine

ARG SERVICE

RUN apk add --update && rm -rf /var/cache/apk/*

RUN npm i -g npm@latest

USER node

WORKDIR /home/node

COPY package*.json ./

RUN npm ci

RUN echo 'Copying ${SERVICE} microservice'

COPY . .

CMD ["node", "index.js"]
