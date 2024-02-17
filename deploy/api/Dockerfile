FROM node:lts-alpine as builder

ARG SERVICE

RUN apk add --update python3 make g++ && rm -rf /var/cache/apk/*

USER node

WORKDIR /home/node

COPY package*.json ./

RUN npm ci --force

COPY . .

RUN echo 'Compiling ${SERVICE} microservice'

RUN npm run build ${SERVICE}

# ---

FROM node:lts-alpine

ENV APP_NAME ''
ENV APP_ENV 'local'
ENV APP_BROKER_HOSTS ''
ENV APP_BROKER_GROUP_ID ''
ENV APP_LOG_LEVEL 'debug'
ENV APP_JWT_TOKEN ''
ENV APP_JWT_EXPIRES_IN 315360000
ENV APP_JWT_VERSION 1
ARG SERVICE

USER node

WORKDIR /home/node

RUN echo 'Building ${SERVICE} image'

COPY --from=builder /home/node/node_modules ./node_modules
COPY --from=builder /home/node/dist/apps/${SERVICE} ./dist/

CMD ["node", "dist/main.js"]
