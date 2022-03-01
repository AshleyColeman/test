# moleculer-monsy

This is a [Moleculer](https://moleculer.services/)-based microservices project.

## SETUP

```sh
cp .env.example .env
```

### How to get `MONSY_GOOGLE_APPLICATION_CREDENTIALS`

In the Firebase console, open Settings > Service Accounts.

Click Generate New Private Key, then confirm by clicking Generate Key.

Securely store the JSON file containing the key.

Download `service-account-file.json` file.

### Docker

```sh
./up.sh
```

### Database

Install sequelize cli

```sh
npx sequelize-cli db:migrate --env init
npx sequelize-cli db:seed:all --env init
```
