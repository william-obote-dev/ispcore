FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    libpq-dev git unzip zip \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .

RUN composer install --no-dev --optimize-autoloader --no-scripts

EXPOSE 10000
CMD php artisan package:discover --ansi && php artisan migrate --force && php artisan serve --host 0.0.0.0 --port ${PORT:-10000}