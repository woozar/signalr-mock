FROM node:16-alpine

RUN apk add curl

COPY package.json yarn.lock index.ts server.key server.cert tsconfig.json tslint.json .

RUN yarn --frozen-lockfile && yarn build && yarn --frozen-lockfile --prod

ENTRYPOINT ["yarn", "start"]