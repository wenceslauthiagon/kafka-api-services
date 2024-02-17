FROM node:lts-alpine as installer

ARG VERSION

RUN apk add --update python3 make g++ jq moreutils git openssl && rm -rf /var/cache/apk/*

RUN npm i -g npm@9.8.1

USER node

WORKDIR /home/node

COPY package*.json ./

RUN if [[ ! -z $VERSION ]]; then jq '.version = "'$VERSION'"' package.json | sponge package.json; fi
RUN if [[ ! -z $VERSION ]]; then jq '.version = "'$VERSION'"' package-lock.json | sponge package-lock.json; fi
RUN if [[ ! -z $VERSION ]]; then jq '.packages."".version = "'$VERSION'"' package-lock.json | sponge package-lock.json; fi

RUN npm ci --force

COPY . .

RUN git config --global --add safe.directory /home/node
RUN openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem -sha256 -days 10950 -subj "/C=BR/ST=Pernambuco/L=Recife/O=Zrobank/OU=TI/CN=zrobank.biz"

# ---

FROM installer as builder

USER node

WORKDIR /home/node

RUN git config --global --add safe.directory /home/node

RUN npm run build:apps:all && echo "Build apps finished"
RUN npm run build:scripts:all && echo "Build scripts finished"

# ---

FROM builder as application

USER node

WORKDIR /home/node

COPY --from=builder /home/node/node_modules ./node_modules
COPY --from=builder /home/node/dist ./dist
COPY --from=builder /home/node/deploy/ecr/run-service.sh .

COPY --from=installer /home/node/key.pem .
COPY --from=installer /home/node/cert.pem .

CMD ["./run-service.sh"]

# ---

FROM builder as script

USER node

WORKDIR /home/node

COPY --from=builder /home/node/node_modules ./node_modules
COPY --from=builder /home/node/dist ./dist
COPY --from=builder /home/node/deploy/ecr/run-script.sh .

CMD ["./run-script.sh"]

# ---

FROM installer as migration

USER node

WORKDIR /home/node

COPY --from=installer /home/node/deploy/ecr/run-migrate.sh .
COPY --from=installer /home/node/deploy/ecr/database.js .
COPY --from=installer /home/node/deploy/ecr/.sequelizerc .

CMD ["./run-migrate.sh"]