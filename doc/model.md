# Migration

## Users

npx sequelize-cli model:generate --name Users --attributes 'uid:string,uuid:string,currencyId:string,name:string,email:string,avatar:string,pin:string,isDarkMode:boolean' --force

## Wallets

npx sequelize-cli model:generate --name Wallets --attributes 'userUuid:string,typeWalletId:string,name:string,balance:float' --force

## Transactions

npx sequelize-cli model:generate --name Transactions --attributes 'userUuid:string,walletId:string,categoryId:string,balance:float,date:date,note:string,type:enum:{income,expense}' --force

## TypeWallets

npx sequelize-cli model:generate --name TypeWallets --attributes 'name:string,icon:string' --force

## Categories

npx sequelize-cli model:generate --name Categories --attributes 'name:string,icon:string,type:enum:{income,expense}' --force

## Currencies

npx sequelize-cli model:generate --name Currencies --attributes 'name:string,description:string,code:string,code:string,currency:string' --force
