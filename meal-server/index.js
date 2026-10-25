import express from 'express';
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";


const app = express();
const port = process.env.PORT || 5000;

// middleware's
app.use(cors()); // for data share between ports
app.use(express.json()); // to parse data

app.get('/', (req, res) => {
  res.send('Server for weekly meal is ready');
});

app.listen(port, () => {
  console.log(`meal-server is listening on port ${port}`);
});