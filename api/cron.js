import admin from 'firebase-admin';
import serviceAccount from '../filecloak-firebase-adminsdk-eylw5-1be5c13bad.json'; // Ensure correct path

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.STORAGEBUCKET  // Replace with your actual bucket URL
  });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

export default async (req, res) => {
  const now = new Date();

  try {
    // Fetch users
    const usersSnapshot = await db.collection('users').get();

    // Iterate over each user
    for (const userDoc of usersSnapshot.docs) {
      // Fetch files for each user
      const filesSnapshot = await db.collection(`users/${userDoc.id}/files`).get();

      // Iterate over each file
      for (const fileDoc of filesSnapshot.docs) {
        const fileData = fileDoc.data();
        const deletionTime = new Date(fileData.deletionTime);

        // Check if the file should be deleted
        if (now >= deletionTime) {
          const fileUrl = fileData.url;
          const fileName = fileUrl.split('/').pop().split('?')[0];

          // Delete file from Firebase Storage
          await bucket.file(`uploads/${fileName}`).delete();
          console.log(`Deleted file: ${fileName} from Firebase Storage`);

          // Delete Firestore document
          await db.collection(`users/${userDoc.id}/files`).doc(fileDoc.id).delete();
          console.log(`Deleted Firestore entry for file: ${fileName}`);
        }
      }
    }

    res.status(200).send('Checked for expired files and cleaned up.');
  } catch (error) {
    console.error('Error while deleting expired files:', error);
    res.status(500).send('Error while deleting expired files.');
  }
};
