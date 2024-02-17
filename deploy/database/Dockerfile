FROM postgres:11-alpine

ENV POSTGRES_USER	'root'
ENV POSTGRES_DB		'zrobank'
ENV POSTGRES_PASSWORD	'abcd'
ARG DATA_PASSWORD

RUN apk add postgresql-contrib gpgme

RUN echo 'CREATE EXTENSION "uuid-ossp";' > /docker-entrypoint-initdb.d/1-enable-uuid.sql

ADD schema.sql /docker-entrypoint-initdb.d/2-schema.sql

ADD data.sql.asc /docker-entrypoint-initdb.d/3-data.sql.asc

RUN echo $DATA_PASSWORD
RUN gpg -d --batch --passphrase=$DATA_PASSWORD /docker-entrypoint-initdb.d/3-data.sql.asc > /docker-entrypoint-initdb.d/3-data.sql
