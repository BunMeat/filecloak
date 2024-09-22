import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://filecloak-default-rtdb.asia-southeast1.firebasedatabase.app/',  // Your Firebase Realtime Database URL
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { userId } = req.body;  // Expect userId in the body

    try {
      // Access the user document by UID and update the 'isBlocked' field
      const userRef = db.collection('users').doc(userId);
      await userRef.update({ isBlocked: 'blocked' });

      res.status(200).json({ message: 'User successfully blocked' });
    } catch (error) {
      console.error('Error blocking user: ', error);
      res.status(500).json({ error: 'Error blocking user' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
