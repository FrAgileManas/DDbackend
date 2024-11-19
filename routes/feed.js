const { BlobServiceClient } = require("@azure/storage-blob");
const express = require("express");
const router = express.Router();
const { MongoClient, ServerApiVersion } = require("mongodb");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const uri = process.env.FEED_DB;
const accountName = process.env.ACCOUNT_NAME;
const sasToken = process.env.SAS_TOKEN;
const containerName = process.env.CONTAINER_NAME;

// Validate environment variables
if (!uri || !accountName || !sasToken || !containerName) {
  throw new Error("Missing required environment variables. Check your .env file.");
}

// Initialize Azure Blob Storage client
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net/?${sasToken}`
);
const containerClient = blobServiceClient.getContainerClient(containerName);

// Initialize MongoDB client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Set up Multer for file uploads
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage });

// Cache MongoDB collection
let postsCollection = null;

// Connect to MongoDB and cache the collection
async function connectToDatabase() {
  try {
    // Attempt to connect to MongoDB by accessing the db
    await client.db(); // If the connection is not established, this will throw an error
    console.log("Connected successfully to MongoDB");

    if (!postsCollection) {
      postsCollection = client.db("FeedDB").collection("posts");
    }

    return postsCollection;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw new Error("Database connection error");
  }
}

// Function to upload an image to Azure Blob Storage
async function uploadImageToStorage(file) {
  if (!file || !file.originalname || !file.buffer) {
    throw new Error("Invalid file object provided for upload");
  }

  try {
    const blobName = Date.now() + path.extname(file.originalname);

    if (!containerClient) {
      throw new Error("ContainerClient is not initialized");
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: { blobContentType: file.mimetype },
    });

    const imageUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
    console.log("Uploaded image URL:", imageUrl);
    return imageUrl;
  } catch (error) {
    console.error("Error uploading image to Azure Blob Storage:", error.message);
    throw new Error("Failed to upload image");
  }
}

// Route to get all posts
router.get("/get-posts", async (req, res) => {
  try {
    const postsCollection = await connectToDatabase();
    const posts = await postsCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// Route to add a new post
router.post("/add-post", upload.single("photo"), async (req, res) => {
  try {
    const postsCollection = await connectToDatabase();

    const { username, caption } = req.body;
    const imageUrl = req.file ? await uploadImageToStorage(req.file) : null;

    if (!username || !caption) {
      return res.status(400).json({ error: "Username and caption are required" });
    }

    const newPost = {
      user: username,
      content: caption,
      imageUrl,
      createdAt: new Date(),
    };

    console.log("New post:", newPost);

    const result = await postsCollection.insertOne(newPost);
    res.status(201).json({
      message: "Post added successfully",
      postId: result.insertedId,  // ID of the newly inserted post
      username: newPost.user,     // Return the username
      content: newPost.content,   // Return the caption/content
      imageUrl: newPost.imageUrl, // Return the image URL
      createdAt: newPost.createdAt, // Return the creation date
    });
  } catch (error) {
    console.error("Error adding post:", error);
    res.status(500).json({ error: "Failed to add post" });
  }
});

module.exports = router;
