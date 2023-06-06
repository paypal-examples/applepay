FROM node:16

ADD . /

ARG CLIENT_ID
ARG CLIENT_SECRET

ENV CLIENT_ID=$CLIENT_ID
ENV CLIENT_SECRET=$CLIENT_SECRET

RUN npm ci && npm cache clean --force --verbose

CMD ["node", "server.js"]
