FROM node:18-slim

WORKDIR /simplepascal/

COPY package*.json .

COPY . /content/

RUN npm install

CMD ["npm", "run", "docker-dev"]
#CMD ["npm", "run", "docker-start"]