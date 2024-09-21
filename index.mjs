import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import admin from 'firebase-admin';
import bodyParser from 'body-parser'; // For parsing JSON request bodies
import initializeApp from 'firebase-app'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Firebase Admin initialization
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://console.firebase.google.com/u/0/project/filecloak"  // Replace with your Firebase project URL
});

// Firestore instance
const db = admin.firestore();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse request body
app.use(bodyParser.json());

// API endpoint to handle failed login attempts
app.post('/loginFailed', async (req, res) => {
  const { email } = req.body;
  console.log("a");
  try {
    // Fetch user by email
    console.log("b");
    const userQuerySnapshot = await db.collection('users').where('email', '==', email).get();

    if (userQuerySnapshot.empty) {
      console.log("c");
      return res.status(404).send('User not found');
    }
    console.log("d");

    const userDoc = userQuerySnapshot.docs[0];
    const userData = userDoc.data();

    // Get failed attempts count or set to 0 if not found
    const failedAttempts = userData.failedAttempts || 0;

    if (failedAttempts >= 2) {
      console.log("e");
      // Disable the user in Firebase Auth if they exceed 2 failed attempts
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(userRecord.uid, { disabled: true });
      return res.status(200).send('User account disabled due to failed login attempts');
    }
    console.log("f");

    // Increment failed attempts count
    await userDoc.ref.update({ failedAttempts: failedAttempts + 1 });

    res.status(200).send('Failed attempts updated');
  } catch (error) {
    console.log("g");
    console.error('Error handling login attempt:', error);
    res.status(500).send('Error handling login attempt');
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
