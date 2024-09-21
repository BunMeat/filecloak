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
  // Handle blocking logic here
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
