const { BlobServiceClient } = require("@azure/storage-blob");
const { log } = require("console");
const express = require("express");
const router = express.Router();
const { MongoClient, ServerApiVersion } = require('mongodb');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const uri = process.env.FEED_DB;
const accountName=process.env.ACCOUNT_NAME;
const sasToken=process.env.SAS_TOKEN;
const containerName=process.env.CONTAINER_NAME;
const blobServiceClient= new BlobServiceClient(`https://${accountName}.blob.core.windows.net/?${sasToken}`);
const containerClient=blobServiceClient.getContainerClient(containerName);

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Set up Multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory (or change to diskStorage for file system storage)
const upload = multer({ storage });

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected successfully to MongoDB");
    return client.db("FeedDB").collection("posts");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

// Route to get all posts
router.get('/get-posts', async (req, res) => {
  try {
    const postsCollection = await connectToDatabase();
    const posts = await postsCollection.find({}).toArray();
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Route to add a new post
router.post('/add-post', upload.single('photo'), async (req, res) => {
  try {
    const postsCollection = await connectToDatabase();
    
    // Extract data from the request
    const { username, caption } = req.body;
    const imageUrl = req.file ? await uploadImageToStorage(req.file) : null; // Function to upload the image and get the URL

    const newPost = {
      user: username,
      content: caption,
      imageUrl: imageUrl,
      createdAt: new Date(),
    };
    console.log(newPost);
    const result = await postsCollection.insertOne(newPost);
    res.status(201).json({ message: "Post added successfully", postId: result.insertedId });
  } catch (error) {
    console.error("Error adding post:", error);
    res.status(500).json({ error: "Failed to add post" });
  }
});

// Function to upload image to cloud storage and return URL (example placeholder)
async function uploadImageToStorage(file) {
    try {
      // Create a unique name for the blob (you can modify this as per your requirements)
      const blobName = Date.now() + path.extname(file.originalname); // Using timestamp to avoid conflicts
  
      // Get a block blob client
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  
      // Upload the file to Azure Blob Storage
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype }, // Set the content type of the blob
      });
  
      // Generate the URL of the uploaded blob
      const imageUrl = `https://${process.env.ACCOUNT_NAME}.blob.core.windows.net/${process.env.CONTAINER_NAME}/${blobName}`;
      return imageUrl;
    } catch (error) {
      console.error("Error uploading image to Azure Blob Storage:", error);
      throw new Error("Failed to upload image");
    }
  }
  

module.exports = router;
