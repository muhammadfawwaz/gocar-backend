const serverless = require('serverless-http');
const express = require('express');
const app = express();
const route = '/api/utility/';
const p = {
    Api_Key: process.env.API_KEY,
    Price_Per_KM: process.env.PRICE_PER_KM,
    Price_Gocar: process.env.PRICE_GOCAR,
    Price_Gocar_L: process.env.PRICE_GOCAR_L,
    Price_Blue: process.env.PRICE_BLUE,
    Price_Goride: process.env.PRICE_GORIDE,
}

app.get(route + 'maps-api-key/', (req, res) => {
  res.send(JSON.stringify({ api_key: p.Api_Key }))
})

app.get(route + 'price/', (req, res) => {
  res.send(JSON.stringify({
      price_per_km: parseInt(p.Price_Per_KM),
      price_gocar: parseInt(p.Price_Gocar),
      price_gocar_L: parseInt(p.Price_Gocar_L),
      price_blue_bird: parseInt(p.Price_Blue),
      price_gride: parseInt(p.Price_Goride),
  }))
})

module.exports.handler = serverless(app);