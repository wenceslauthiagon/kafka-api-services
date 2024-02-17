#!/bin/sh

features=""

for feature in $(find ${1:-.} -name '*.feature' 2>/dev/null); do
  echo "Feature found: ${feature}"
  features="${features} -m ${feature}"
done

if [ "${features}" != "" ];
then
  java -jar karate-1.1.0.jar -p ${2:-8088} ${features}
else
  echo "No features found! Exiting..."
fi
