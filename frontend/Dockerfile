FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom proxy configuration
COPY nginx.conf /etc/nginx/conf.d/

# Copy static frontend files to nginx html serving directory
COPY . /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
