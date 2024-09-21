import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: 'https://filecloak-default-rtdb.asia-southeast1.firebasedatabase.app/'  // Add your Firebase Realtime Database URL
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email } = req.body;

    try {
      // Fetch the user by email from Firestore
      const userQuerySnapshot = await db.collection('users').where('email', '==', email).get();

      if (userQuerySnapshot.empty) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userDoc = userQuerySnapshot.docs[0];
      const userId = userDoc.id;

      // Update the 'isBlocked' field to 'blocked'
      await userDoc.ref.update({ isBlocked: 'blocked' });

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
