const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to FreshNTrack API!');
});

// MongoDB setup
const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_Pass}@cluster0.9jhst3g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const database = client.db("FreshNTrack");
    const UserCollection = database.collection("Users");

    // Register user endpoint
    app.post('/auth/register', async (req, res) => {
      try {
        const user = req.body;
        const result = await UserCollection.insertOne(user);
        res.send(result);
      } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).send({ message: 'Registration failed', error: err.message });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB successfully!");
  } catch (err) {
    console.error('MongoDB connection failed:', err);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
