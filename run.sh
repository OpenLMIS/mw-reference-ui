#!/bin/sh
apt-get install -y gettext
envsubst "`printf '${%s} ' $(sh -c "env|cut -d'=' -f1")`" < /usr/share/nginx/html/openlmis.js > temp.js
cat temp.js > /usr/share/nginx/html/openlmis.js

node consul/registration.js -c register -f consul/config.json
nginx -g 'daemon off;'
