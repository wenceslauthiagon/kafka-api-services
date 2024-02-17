#!/bin/sh

SERVICE=${1:-api-users}

cp -r dist/apps/$SERVICE/* .

cp /environment/.env.vault .
npx -y dotenv-vault decrypt $DOTENV_KEY > .$SERVICE.env

export APP_HTTPS_KEY_FILE=key.pem
export APP_HTTPS_CERT_FILE=cert.pem

node main.js
