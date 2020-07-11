FROM node:latest

WORKDIR /app

COPY ./package.json /app
COPY ./index.js /app
COPY ./schema.js /app
COPY ./config /app/config

RUN mkdir uploads
RUN npm i

EXPOSE 80:4000

CMD ["node", "index.js"]