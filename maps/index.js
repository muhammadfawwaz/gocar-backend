const serverless = require('serverless-http');
const express = require('express');
const app = express();
const route = '/api/maps/';
const axios = require('axios').default;
const p = {
    Api_Key: process.env.API_KEY
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post(route + 'nearby-driver/', async (req, res) => {
    if(Object.keys(req.body).length === 0 || !req.body.latitude || !req.body.longitude) return res.send(JSON.stringify({ message: 'missing latitude or longitude value' }));
    let url = 'https://hv9tflnbgk.execute-api.us-east-1.amazonaws.com/dev/api/driver';
    let response = await axios.get(url);
    const drivers = [...response.data.drivers];
    const { latitude, longitude } = req.body;
    const result = [];
    let i = 0;
    let j = 0;
    while(i < drivers.length && j < 5) {
        url = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins=' + latitude + ',' + longitude + '&destinations=' + drivers[i].lat_lng.latitude + ',' + drivers[i].lat_lng.longitude + '&key=' + p.Api_Key;
        response = await axios.get(url);
        if(drivers[i].stat === 0 && parseInt(response.data.rows[0].elements[0].distance.value) <= 5000) {
            j++;
            result.push({
                id: drivers[i].id,
                lat_lng: {
                    ...drivers[i].lat_lng
                }
            });
        }
        i++
    }
    return res.send(JSON.stringify({ drivers: [...result] })) ;
    
})

app.post(route + 'nearby-location/', async (req, res) => {
    if(Object.keys(req.body).length === 0 || !req.body.latitude || !req.body.longitude) return res.send(JSON.stringify({ message: 'missing latitude or longitude value' }))
    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?query=&location=' + req.body.latitude + ',' + req.body.longitude + '&radius=10&key=' + p.Api_Key;
    let response = await axios.get(url);
    res.send(JSON.stringify({
        maps: [...response.data.results.slice(0, 5)]
    }))
})

app.post(route + 'text-search/', async (req, res) => {
    if(Object.keys(req.body).length === 0 || !req.body.text) return res.send(JSON.stringify({ message: 'missing keyword value' }))
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + req.body.text + '&radius=50000&location=' + req.body.latitude + ',' + req.body.longitude + '&key=' + p.Api_Key;
    let response = await axios.get(url);
    res.send(JSON.stringify({
        maps: [...response.data.results.slice(0, 8)]
    }))
})

app.post(route + 'direction/', async (req, res) => {
    if(Object.keys(req.body).length === 0 || !req.body.pickup || !req.body.destination) return res.send(JSON.stringify({ message: 'missing pickup or destination point' }));
    const url = 'https://maps.googleapis.com/maps/api/directions/json?origin=' + req.body.pickup.latitude + ',' + req.body.pickup.longitude + '&destination=' + req.body.destination.latitude + ',' + req.body.destination.longitude + '&key=' + p.Api_Key  ;
    let response = await axios.get(url);
    res.send(JSON.stringify({
        maps: {...response.data.routes[0]}
    }))
})

module.exports.handler = serverless(app);