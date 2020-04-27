const serverless = require('serverless-http');
const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const crypto = require('crypto');
const documentClient = new AWS.DynamoDB.DocumentClient();
const route = '/api/order/';
const TableName = process.env.TABLE_NAME;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get(route, (req, res) => {
  let p = {
    TableName
  }

  documentClient.scan(p, (err, data) => {
    if(err) return res.send(JSON.stringify({ error: 'database error' }));
    return res.send(JSON.stringify({drivers: [...data.Items]}));
  });
  
});

app.post(route + 'insert/', async (req, res) => {
  if(Object.keys(req.body).length === 0 || !req.body.payment_method || !req.body.cost || !req.body.pickup_latlng || !req.body.destination_latlng || !req.body.distance || !req.body.identity_card) return res.send(JSON.stringify({ error: 'missing notes, payment_method, cost, pickup_latlng, destination_latlng, identity_card, or distance' }));
  if(req.body.payment_method.toLowerCase() !== 'cash' && req.body.payment_method.toLowerCase() !== 'gopay') return res.send(JSON.stringify({ error: 'payment_method value is false' }));
  const generateUUID = () => crypto.randomBytes(16).toString("hex");
  const { payment_method, cost, distance, pickup_latlng, destination_latlng, identity_card } = req.body;
  const date = new Date();
  const id = generateUUID();
  
  const p = {
    TableName,
    Item: {
      id,
      notes: req.body.notes ? req.body.notes : '-',
      date: date.getDate() + '-' + date.getMonth() + '-' + date.getFullYear(),
      time_start: date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds(),
      payment_method,
      cost,
      distance,
      pickup_latlng,
      destination_latlng,
      stat: 0,
      identity_card
    }
  }
  
  documentClient.put(p, (err, data) => {
    if(err) return res.send(JSON.stringify({ ...err }));
    return res.send(JSON.stringify({ 
      message: 'order has been added',
      id
    }));
  })

})

app.post(route + 'otw/', async (req, res) => {
  if(Object.keys(req.body).length === 0 || !req.body.id) return res.send(JSON.stringify({ error: 'missing driver id' }));

  const p = {
    TableName,
    Key: {
      "id": req.body.id
    },
    UpdateExpression: "set stat = :s",
    ExpressionAttributeValues:{
        ":s": 1,
    },
    ReturnValues:"UPDATED_NEW"
  }

  documentClient.update(p, (err, data) => {
    if(err) return res.send(JSON.stringify({ ...err }));
    return res.send(JSON.stringify({ message: 'order has been edited' }));
  })

})

app.post(route + 'arrived/', async (req, res) => {
  if(Object.keys(req.body).length === 0 || !req.body.id) return res.send(JSON.stringify({ error: 'missing driver id' }));
  const date = new Date();

  const p = {
    TableName,
    Key: {
      "id": req.body.id
    },
    UpdateExpression: "set stat = :s, time_end = :t",
    ExpressionAttributeValues:{
        ":s": 2,
        ":t": date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
    },
    ReturnValues:"UPDATED_NEW"
  }

  documentClient.update(p, (err, data) => {
    if(err) return res.send(JSON.stringify({ ...err }));
    return res.send(JSON.stringify({ message: 'order has been edited' }));
  })

})

app.post(route + 'cancel/', async (req, res) => {
  if(Object.keys(req.body).length === 0 || !req.body.id) return res.send(JSON.stringify({ error: 'missing driver id' }));

  const p = {
    TableName,
    Key: {
      "id": req.body.id
    },
    UpdateExpression: "set stat = :s",
    ExpressionAttributeValues:{
        ":s": 3,
    },
    ReturnValues:"UPDATED_NEW"
  }

  documentClient.update(p, (err, data) => {
    if(err) return res.send(JSON.stringify({ ...err }));
    return res.send(JSON.stringify({ message: 'order has been edited' }));
  })

})

module.exports.handler = serverless(app);