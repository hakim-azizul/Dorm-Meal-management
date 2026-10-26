import { MongoClient, Db } from "mongodb";

const uri =
  process.env.DB_URL ||
  process.env.MONGODB_URI ||
  "mongodb://weekly-meal:VpQhmt1QqG0mU55K@ac-vwgi4dy-shard-00-00.yleslu4.mongodb.net:27017,ac-vwgi4dy-shard-00-01.yleslu4.mongodb.net:27017,ac-vwgi4dy-shard-00-02.yleslu4.mongodb.net:27017/weekly-meal?ssl=true&replicaSet=atlas-ydwn0o-shard-0&authSource=admin";

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDatabase(dbName = "weekly-meal"): Promise<Db> {
  const connectedClient = await clientPromise;
  return connectedClient.db(dbName);
}
