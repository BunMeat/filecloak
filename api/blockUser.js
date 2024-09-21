import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://filecloak-default-rtdb.asia-southeast1.firebasedatabase.app/"  // Replace with your actual project ID
});

const db = admin.database();  // For Realtime Database
const auth = admin.auth();    // For Firebase Authentication

app.post('/loginFailed', async (req, res) => {
    const { email } = req.body;
  
    try {
      // Get user by email in Firebase Auth
      const userRecord = await auth.getUserByEmail(email);
      const userId = userRecord.uid;
  
      // Reference to the user's failed attempts in Realtime Database
      const userRef = db.ref(`failedAttempts/${userId}`);
  
      // Get current failed attempts from the database
      const snapshot = await userRef.once('value');
      const userData = snapshot.val();
  
      if (userData) {
        let attempts = userData.attempts || 0;
  
        if (attempts >= 2) {
          // Block the user if they have 3 failed attempts
          await auth.updateUser(userId, { disabled: true });
          await userRef.update({ attempts: 3, isBlocked: true });
          res.status(200).send('User account blocked due to failed login attempts');
        } else {
          // Increment the failed attempts
          await userRef.update({ attempts: attempts + 1 });
          res.status(200).send('Failed attempts updated');
        }
      } else {
        // If user data doesn't exist, initialize with 1 failed attempt
        await userRef.set({
          email: email,
          attempts: 1,
          isBlocked: false
        });
        res.status(200).send('Failed attempts initialized');
      }
    } catch (error) {
      console.error('Error handling login attempt:', error);
      res.status(500).send('Error handling login attempt');
    }
  });
    