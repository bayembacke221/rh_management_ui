# Étape de build
FROM node:20-alpine AS build

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste du code source
COPY . .

# Construire l'application
RUN npm run build

# Étape de production avec Nginx
FROM nginx:alpine

# Copier les fichiers de build
COPY --from=build /app/dist/rh_management_ui/browser /usr/share/nginx/html

# Configurer Nginx pour gérer le routage côté client d'Angular
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
