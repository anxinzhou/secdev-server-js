From node:10

WORKDIR /alpha/backend

COPY . .

RUN npm i -f

CMD ["npm","run","dev"]

EXPOSE 3000ddsad

