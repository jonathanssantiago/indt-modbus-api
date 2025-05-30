#!/bin/sh

echo "Waiting for database to be ready..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done
echo "Database is ready!"

echo "Running database migrations..."
npm run migration:run

echo "Starting application..."
npm run start:prod 