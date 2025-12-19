import { MongoClient } from "mongodb";

export const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";

export const client = new MongoClient(mongoUri);

const samurai = client.db("samurai");

export const posts = samurai.collection("posts");
export const blogs = samurai.collection("blogs");

export async function runDb() {
  try {
    //connect client to the server
    await client.connect();
    //Establish and verify connection
    await client.db("blogs").command({ ping: 1 });
    console.log("Connected successfully to server");
  } catch (e) {
    console.log("Error connecting to server: ", e);
    await client.close();
  }
}
