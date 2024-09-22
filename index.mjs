import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware for JSON requests
app.use(express.json());

// Example of an API route
app.post('/api/blockUser', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization token missing' });
  }

  const token = authHeader.split(' ')[1];  // Extract the token

  // Verify the token (if you're using Firebase, use Firebase Admin SDK)
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;  // Now you can proceed with the blocking logic
    
    // Handle blocking logic...
    res.status(200).json({ message: 'User successfully blocked' });
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
