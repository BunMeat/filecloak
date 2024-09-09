const cron = require('node-cron');
const admin = require('firebase-admin');

// Parse the environment variable to get the Firebase service account credentials
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.STORAGEBUCKET
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Cron job: runs every hour
cron.schedule('0 * * * *', async () => {
  console.log('Checking for expired files...');

  const now = new Date();
  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();

    usersSnapshot.forEach(async (userDoc) => {
      const filesSnapshot = await db.collection(`users/${userDoc.id}/files`).get();

      filesSnapshot.forEach(async (fileDoc) => {
        const fileData = fileDoc.data();
        const deletionTime = new Date(fileData.deletionTime);

        // If current time exceeds the deletion time, delete the file
        if (now >= deletionTime) {
          const fileUrl = fileData.url; // Get the file URL
          const fileName = fileUrl.split('/').pop().split('?')[0]; // Extract the file name from the URL

          // Delete the file from Firebase Storage
          await bucket.file(`uploads/${fileName}`).delete();
          console.log(`Deleted file: ${fileName} from Firebase Storage`);

          // Delete the document from Firestore
          await db.collection(`users/${userDoc.id}/files`).doc(fileDoc.id).delete();
          console.log(`Deleted Firestore entry for file: ${fileName}`);
        }
      });
    });
  } catch (error) {
    console.error('Error while deleting expired files:', error);
  }
});
