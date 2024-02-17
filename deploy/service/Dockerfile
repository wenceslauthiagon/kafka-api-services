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
ENV APP_DATABASE_HOST 'zrodb'
ENV APP_DATABASE_PORT 5432
ENV APP_DATABASE_SCHEMA public
ENV APP_DATABASE_DATABASE ''
ENV APP_DATABASE_USERNAME ''
ENV APP_DATABASE_PASSWORD ''
ENV APP_DATABASE_SSL 'false'
ENV APP_DATABASE_MIGRATION_TABLE ''
ENV APP_DATABASE_SEEDERS_TABLE ''
ENV APP_DATABASE_LOG 'true'
ENV APP_BROKER_HOSTS ''
ENV APP_BROKER_GROUP_ID ''
ENV APP_LOG_LEVEL 'debug'
ARG SERVICE

USER node

WORKDIR /home/node

RUN echo 'Building ${SERVICE} image'

COPY --from=builder /home/node/node_modules ./node_modules
COPY --from=builder /home/node/dist/apps/${SERVICE} ./dist

COPY config/database.js ./config/database.js
COPY apps/${SERVICE}/src/infrastructure/sequelize ./sequelize

COPY deploy/service/run-service.sh ./
COPY deploy/service/.sequelizerc ./

CMD ["./run-service.sh", "dist/main.js"]
