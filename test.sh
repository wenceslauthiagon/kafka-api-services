#!/bin/bash
KILL=$1

if [ "$KILL" == "--kill-if-fail" ]; then
  # exit when any command fails
  set -e
fi

# keep track of the last executed command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
# echo an error message before exiting
trap 'echo "\"${last_command}\" command filed with exit code $?."' EXIT

BLUE='\033[0;34m'
NC='\033[0m' # No Color

for d in apps/* ;  do
  echo -e "${BLUE}Test APP: $d ${NC}"
  APP_ENV=test node --expose-gc node_modules/.bin/jest --detectOpenHandles --runInBand --passWithNoTests --silent --logHeapUsage "$d"
  echo -e "-------------------------------------------------------------------------------\n"
done

for d in libs/* ;  do
  echo -e "${BLUE}Test LIB: $d ${NC}"
  APP_ENV=test node --expose-gc node_modules/.bin/jest --detectOpenHandles --runInBand --passWithNoTests --silent --logHeapUsage "$d"
  echo -e "-------------------------------------------------------------------------------\n"
done

trap - DEBUG EXIT
