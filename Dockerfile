FROM node:14-slim

ADD . /

ARG CLIENT_ID
ARG CLIENT_SECRET

ENV CLIENT_ID=$CLIENT_ID
ENV CLIENT_SECRET=$CLIENT_SECRET

RUN npm ci && npm cache clean --force

CMD node server/index.js