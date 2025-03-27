FROM nginx:latest as runner
WORKDIR /usr/share/nginx/html
COPY . .

