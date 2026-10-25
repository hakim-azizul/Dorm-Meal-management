import express from 'express';
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";


const app = express();
const port = process.env.PORT || 5000;

// middleware's
app.use(cors()); // for data share between ports
app.use(express.json()); // to parse data

import { MongoClient } from 'mongodb';

const client = new MongoClient(`mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ac-vwgi4dy-shard-00-00.yleslu4.mongodb.net:27017,ac-vwgi4dy-shard-00-01.yleslu4.mongodb.net:27017,ac-vwgi4dy-shard-00-02.yleslu4.mongodb.net:27017/?ssl=true&replicaSet=atlas-ydwn0o-shard-0&authSource=admin`);

export const connectToMongoDB = async() =>{
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.log(err);
  }
}
const connectedClient = await connectToMongoDB();
const database = connectedClient.db("weekly-meal");
const users = database.collection("users");


app.get('/', (req, res) => {
  res.send('Server for weekly meal is ready');
});

app.listen(port, () => {
  console.log(`meal-server is listening on port ${port}`);
});