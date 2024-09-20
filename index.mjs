import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Firebase Admin initialization
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// API endpoint to disable user
app.post('/disableUser', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { disabled: true });
    res.status(200).send('User account disabled');
  } catch (error) {
    console.error('Error disabling user:', error);
    res.status(500).send('Failed to disable user');
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
