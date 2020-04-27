const serverless = require('serverless-http');
const express = require('express');
const app = express();
const AWS = require('aws-sdk');
const documentClient = new AWS.DynamoDB.DocumentClient();
const route = '/api/driver/';
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

app.get(route + ':id', (req, res) => {
  console.log(req.params.id)
  let p = {
    TableName,
    KeyConditionExpression: "#identity_card = :identity_card",
    ExpressionAttributeNames:{
        "#identity_card": "identity_card"
    },
    ExpressionAttributeValues: {
        ":identity_card": req.params.id
    }
  }

  documentClient.query(p, (err, data) => {
    if(err) return res.send(JSON.stringify({ error: { ...err } }));
    console.log(data)
    return res.send(JSON.stringify({drivers: {...data.Items[0]}}));
  });
  
});

app.post(route + 'update-trip/', (req, res) => {
  if(Object.keys(req.body).length === 0 || !req.body.identity_card || !req.body.latitude || !req.body.longitude) return res.send(JSON.stringify({ error: 'missing driver identity_card, latitude, or longitude' }));

  let p = {
    TableName,
    Key: {
      "identity_card": req.body.identity_card
    },
    UpdateExpression: "set stat = :s, lat_lng.latitude = :lat, lat_lng.longitude = :lng, total_trip = total_trip + :trip",
    ExpressionAttributeValues:{
        ":s": 0,
        ":trip": 1,
        ":lat": req.body.latitude,
        ":lng": req.body.longitude
    },
    ReturnValues:"UPDATED_NEW"
  }

  documentClient.update(p, (err, data) => {
    if(err) return res.send(JSON.stringify({ ...err }));
    return res.send(JSON.stringify({ message: 'trip has been updated' }));
  })
})

app.post(route + 'update-status/', (req, res) => {
  if(Object.keys(req.body).length === 0 || !req.body.identity_card || !req.body.stat) return res.send(JSON.stringify({ error: 'missing driver identity_card or stat' }));
  
  let p = {
    TableName,
    Key: {
      "identity_card": req.body.identity_card
    },
    UpdateExpression: "set stat = :s",
    ExpressionAttributeValues:{
        ":s": req.body.stat
    },
    ReturnValues:"UPDATED_NEW"
  }

  documentClient.update(p, (err, data) => {
    if(err) return res.send(JSON.stringify({ ...err }));
    return res.send(JSON.stringify({ message: 'status has been updated' }));
  })
})

app.post(route + 'update-rating/', (req, res) => {
  if(Object.keys(req.body).length === 0 || !req.body.identity_card || !req.body.rating) return res.send(JSON.stringify({ error: 'missing driver identity_card or rating' }));
  if (req.body.rating < 1 || req.body.rating > 5) return res.send(JSON.stringify({ error: 'rating value is false' }));
  
  let p = {
    TableName,
    Key: {
      "identity_card": req.body.identity_card
    },
  }

  documentClient.get(p, (err, data) => {
    if(err) return res.send(JSON.stringify({ ...err }));
    const sum = data.Item.rating_list.reduce((a, b) => a + b, 0);
    const avg = ((sum + parseInt(req.body.rating)) / (data.Item.rating_list.length + 1)).toFixed(1);
    const newRating = [req.body.rating];
    
    p = {
      TableName,
      Key: {
        "identity_card": req.body.identity_card
      },
      UpdateExpression: "set rating_list = list_append(rating_list, :newRating), rating_avg = :rating",
      ExpressionAttributeValues:{
          ":rating": avg,
          ":newRating": newRating
      },
      ReturnValues:"UPDATED_NEW"
    }

    documentClient.update(p, (err2, data2) => {
      if(err) return res.send(JSON.stringify({ ...err2 }));
      res.send(JSON.stringify({...data2}));
    })

  });
})



module.exports.handler = serverless(app);