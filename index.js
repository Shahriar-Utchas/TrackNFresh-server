const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to FreshNTrack API!');
});

// Firebase Admin SDK setup
const admin = require("firebase-admin");
const FirebaseDecodedKey = Buffer.from(process.env.FIREBASE_SERVER_KEY, 'base64').toString('utf8');
const serviceAccount = JSON.parse(FirebaseDecodedKey);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

//Token verification middleware
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }

  const token = authHeader.split(' ')[1];
  try {
       const decodedToken = await admin.auth().verifyIdToken(token);
       req.decoded = decodedToken; 
       next();

  } catch (error) {
      return res.status(401).send({ message: 'Invalid token' });
  }


};


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
    const FoodCollection = database.collection("FoodItems");

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

  // Add Food-item endpoint
  app.post('/food/add', verifyToken, async (req, res) => {

    if(req.body.foodCreatorEmail!== req.decoded.email) {
      return res.status(403).send({ message: 'Forbidden: You are not allowed to add food items for this user.' });
    }
    try { 
      const foodItem = req.body;
      const result = await FoodCollection.insertOne(foodItem);
      res.send(result);
    } catch (err) {
      console.error('Add Food Item Error:', err);
      res.status(500).send({ message: 'Failed to add food item', error: err.message });
    }
  }
  );

  //all food items endpoint
  app.get('/food/all', async (req, res) => {
    try {
      const cursor = FoodCollection.find({});
      const foodItems = await cursor.toArray();
      res.send(foodItems);
    } catch (err) {
      console.error('Fetch Food Items Error:', err);
      res.status(500).send({ message: 'Failed to fetch food items', error: err.message });
    }
  }
  );

  // Get food items by creator email
  app.get('/food/my-items', verifyToken, async (req, res) => {
    const foodCreatorEmail = req.query.email;

    if (foodCreatorEmail !== req.decoded.email) {
        return res.status(403).send({
            message: 'Forbidden: You are not allowed to access food items for this user.'
        });
    }

    try {
        const foodItems = await FoodCollection.find({ foodCreatorEmail }).toArray();
        res.send(foodItems);
    } catch (err) {
        console.error('Fetch Food Items by Creator Error:', err);
        res.status(500).send({
            message: 'Failed to fetch food items',
            error: err.message
        });
    }
  });


  //delete food item endpoint
  app.delete('/food/delete/:id', verifyToken, async (req, res) => {
    const foodItemId = req.params.id;
    if (!foodItemId) {
      return res.status(400).send({ message: 'Food item ID is required' });
    }
    try {
      const result = await FoodCollection.deleteOne({ _id: new ObjectId(foodItemId) });
      if (result.deletedCount === 0) {
        return res.status(404).send({ message: 'Food item not found' });
      }
      res.send(result);
    } catch (err) {
      console.error('Delete Food Item Error:', err);
      res.status(500).send({ message: 'Failed to delete food item', error: err.message });
    }
  }
  );

  // 6 food items with the nearest upcoming expiry dates
app.get('/food/nearest-expiring', async (req, res) => {
  const today = new Date();
  const fiveDaysLater = new Date();
  fiveDaysLater.setDate(today.getDate() + 5);

  try {
    const items = await FoodCollection.find({
      $expr: {
        $and: [
          { $gte: [{ $toDate: "$expiryDate" }, today] },
          { $lte: [{ $toDate: "$expiryDate" }, fiveDaysLater] }
        ]
      }
    })
      .sort({ expiryDate: 1 })
      .limit(6)
      .toArray();

    res.send(items);
  } catch (error) {
    console.error('Failed to fetch nearest expiring items:', error);
    res.status(500).send({
      message: 'Failed to fetch nearest expiring items',
      error: error.message
    });
  }
});



  //all expired food items endpoint
  app.get('/food/expired', async (req, res) => {
    const today = new Date();

    try {
      const expiredItems = await FoodCollection.find({
        $expr: {
          $lt: [{ $toDate: "$expiryDate" }, today]
        }
      }).sort({ expiryDate: -1 }).toArray();

      res.send(expiredItems);
    } catch (error) {
      console.error('Failed to fetch expired items:', error);
      res.status(500).send({
        message: 'Failed to fetch expired items',
        error: error.message
      });
    }
  });

  //get food item by id
  app.get('/food/:id', async (req, res) => {
    const foodItemId = req.params.id;
    if (!foodItemId) {
      return res.status(400).send({ message: 'Food item ID is required' });
    }
    try {
      const foodItem = await FoodCollection.findOne({ _id: new ObjectId(foodItemId) });
      if (!foodItem) {
        return res.status(404).send({ message: 'Food item not found' });
      }
      res.send(foodItem);
    } catch (err) {
      console.error('Fetch Food Item Error:', err);
      res.status(500).send({ message: 'Failed to fetch food item', error: err.message });
    }
  }
  );

  // Update food item endpoint
  app.put('/food/update/:id', verifyToken, async (req, res) => {
    const foodItemId = req.params.id;
    const updateData = req.body;

    if (!foodItemId) {
      return res.status(400).send({ message: 'Food item ID is required' });
    }
    
    if (updateData.foodCreatorEmail !== req.decoded.email) {
      return res.status(403).send({
        message: 'Forbidden: You are not allowed to update food items for this user.',
      });
    }

    try {
      const result = await FoodCollection.updateOne(
        { _id: new ObjectId(foodItemId) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).send({ message: 'Food item not found' });
      }

      res.send({ message: 'Food item updated successfully', modifiedCount: result.modifiedCount });
    } catch (err) {
      console.error('Update Food Item Error:', err);
      res.status(500).send({ message: 'Failed to update food item', error: err.message });
    }
  });


  //update food item notes endpoint
  app.put('/food/update/note/:id', verifyToken, async (req, res) => {
    const foodItemId = req.params.id;

    if (!foodItemId) {
      return res.status(400).send({ message: 'Food item ID is required' });
    }
    console.log('Decoded Email:', req.decoded.email);
    console.log('Request Body Email:', req.body.foodCreatorEmail);

    if (req.body.foodCreatorEmail !== req.decoded.email) {
      return res.status(403).send({
        message: 'Forbidden: You are not allowed to update food items for this user.',
      });
    }

    try {
      const newNote = req.body.note; 
      const result = await FoodCollection.updateOne(
        { _id: new ObjectId(foodItemId) },
        {
          $push: { notes: newNote }
        }
      );

      if (result.matchedCount === 0) {
        return res.status(404).send({ message: 'Food item not found' });
      }

      res.send(result);
    } catch (err) {
      console.error('Update Food Item Error:', err);
      res.status(500).send({ message: 'Failed to update food item', error: err.message });
    }
  });


  // DELETE /food/:id/note
  app.delete('/food/:id/note', verifyToken, async (req, res) => {
    const foodId = req.params.id;
    const { note } = req.body; 

  try {
    const result = await FoodCollection.updateOne(
      { _id: new ObjectId(foodId) },
      { $pull: { notes: note } } 
    );

    if (result.modifiedCount > 0) {
      res.send({ message: 'Note deleted successfully' });
    } else {
      res.status(404).send({ error: 'Note not found or already deleted' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to delete note' });
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
