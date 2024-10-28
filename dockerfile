FROM node:18-slim

WORKDIR /simplepascal/

COPY package*.json /simplepascal/

RUN npm install

COPY . /simplepascal/

# CMD ["npm", "start"]
CMD ["npm", "run", "dev"]