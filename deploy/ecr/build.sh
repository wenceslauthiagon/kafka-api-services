#!/bin/sh

for appd in ./apps/*; do
  app=$(basename $appd)
  echo "Compiling $app"
  npm run build $app
done

echo "Build finished"
