#!/bin/sh

SCRIPT=${1:-create-kafka-topics}

cp -r dist/scripts/$SCRIPT/* .

cp /environment/.env.vault .
npx -y dotenv-vault decrypt $DOTENV_KEY > .$SCRIPT.env

node main.js
