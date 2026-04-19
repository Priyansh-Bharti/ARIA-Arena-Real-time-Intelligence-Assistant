# Use the official Node.js 20 lts image
FROM node:20-slim

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
RUN npm install

# Prune devDependencies after install to minimize production image size
RUN npm prune --omit=dev

# Copy local code to the container image.
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Run the web service on container startup.
CMD [ "npm", "start" ]
