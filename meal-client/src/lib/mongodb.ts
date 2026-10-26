import { MongoClient, Db } from "mongodb";

const uri = process.env.DB_URL || process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Please define the DB_URL or MONGODB_URI environment variable inside .env");
}

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
