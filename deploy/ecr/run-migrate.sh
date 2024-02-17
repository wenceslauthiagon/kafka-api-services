#!/bin/sh

SERVICE=${1:-api-users}
COMMAND=${2:-"db:migrate"}

if [[ -d "apps/${SERVICE}/src/infrastructure/sequelize" ]]; then
  cp /environment/.env.vault .
  npx -y dotenv-vault decrypt $DOTENV_KEY > .env

  cp -r apps/${SERVICE}/src/infrastructure/sequelize ./sequelize
  
  npx -y sequelize $COMMAND
fi