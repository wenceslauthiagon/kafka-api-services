#!/bin/bash

command=${1:-"db:migrate"}

for envfile in $(find . -name '.*.env' | sort); do
  echo "Migrate ${envfile} | Command: ${command}"
  echo
  ENV_FILE=${envfile} npx sequelize ${command}
  echo '-----'
  echo ''
done
