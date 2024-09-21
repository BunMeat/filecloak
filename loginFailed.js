import admin from 'firebase-admin';

// Firebase Admin initialization
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://filecloak-default-rtdb.asia-southeast1.firebasedatabase.app/"  // Replace with your Firebase project URL
});

// Firestore instance
const db = admin.firestore();

export const loginFailedHandler = async (req, res) => {
  const { email } = req.body;
  try {
    // Fetch user by email
    const userQuerySnapshot = await db.collection('users').where('email', '==', email).get();

    if (userQuerySnapshot.empty) {
      return res.status(404).send('User not found');
    }

    const userDoc = userQuerySnapshot.docs[0];
    const userData = userDoc.data();

    // Get failed attempts count or set to 0 if not found
    const failedAttempts = userData.failedAttempts || 0;

    if (failedAttempts >= 2) {
      // Disable the user in Firebase Auth if they exceed 2 failed attempts
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(userRecord.uid, { disabled: true });
      return res.status(200).send({ message: 'User account disabled due to failed login attempts' });
    }

    // Increment failed attempts count
    await userDoc.ref.update({ failedAttempts: failedAttempts + 1 });

    res.status(200).send({ message: 'Failed attempts updated' });
  } catch (error) {
    console.error('Error handling login attempt:', error);
    res.status(500).send({ error: 'Error handling login attempt' });
  }
};
