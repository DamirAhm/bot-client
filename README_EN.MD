# School Bot Client

## Description

This web app was made as a web client for my ["school bot" project](https://github.com/damirahm/bot).
I made it because as for me site is more comfortable type of apps. Anyway vk bot is more useful with bad internet connection, but for most of operations i prefer this app. Also with this app you can a few things, you can't do with bot, such as changing creating classes, students, asserting admin role etc.

### Technologies

#### Back-end

On back-end this app made with nodejs + express + mongodb/mongoose, also i used [graphql-compose-mongoose](https://github.com/graphql-compose/graphql-compose-mongoose) from [Paul Damnhorns](https://github.com/nodkz) for easier work with graphql, because it was first time i used it.

#### Front-end

On front-end this app made with React + Apollo client + some react specific libraries.

## How to launch?

1. Download repo

```shell
$ git clone https://github.com.damirahm/bot-client
$ cd bot-client
```

2. Prepare you're .env for Front-end
   a) **REACT_APP_APP_ID** - to specify your vk app id
   b) **REACT_APP_SECRET** - to specify secret for md5 codes
   c) **REACT_APP_USER** - to set default user in dev mode

3. Prepare you're .env for Back-end
   a) **TOKEN** - to specify your vk token
   b) **MONGODB_URI** - to specify your mongodb uri
   c) **VK_API_KEY** - to specify your vk api key
   d) **PORT** - to specify port to run app on

4. Start application

```shell
$ npm install
$ npm run start
```

For additional info check [bot](https://github.com/damirahm/bot)
