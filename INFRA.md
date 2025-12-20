- we'll use convex this for the first ten clients, then for the next 100, we'll migrate to cloudflare d1, under one account.
- I will create a convex account for each one of the 10 clients. (I will get an idea of the infra cost of an average client), and make a new storefront folder
- so every storefront and dashboard will have a different convex api key, and slightly different code.
- for the dasbhoard I will deploy a different dashboard for each client with a different convex api key.
- for the storefronts, I will create a different folder for each client, change the code and deploy it.


for each client of the few first ones :
- create a new convex account to host the api
- make new folder for the storefront (because it will have slightly different code)
- create a new cloudflare account to host the storefront and the dashboard

for the next 100 clients :
- we will migrate off of convex into cf d1 all users under one client.
