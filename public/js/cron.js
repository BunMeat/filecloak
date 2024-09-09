const cron = require('node-cron');
const { getFirestore, collection, getDocs, doc, deleteDoc } = require('firebase-admin/firestore');
const { getStorage, ref, deleteObject } = require('firebase-admin/storage');

// Initialize Firebase Admin
const admin = require('firebase-admin');
admin.initializeApp();

const firestore = getFirestore();
const storage = getStorage();

cron.schedule('0 * * * *', async () => {
  console.log('Checking for expired files...');

  const now = new Date();
  const userCollection = collection(firestore, 'users');
  const usersSnapshot = await getDocs(userCollection);

  usersSnapshot.forEach(async (userDoc) => {
    const filesSubCollection = collection(userDoc.ref, 'files');
    const filesSnapshot = await getDocs(filesSubCollection);

    filesSnapshot.forEach(async (fileDoc) => {
      const fileData = fileDoc.data();

      // If the current time is past the deletion time, delete the file
      if (fileData.deletionTime.toDate() < now) {
        const fileRef = ref(storage, fileData.url);
        
        // Delete file from Firebase Storage
        await deleteObject(fileRef).catch((error) => {
          console.error('Error deleting file from Storage:', error);
        });

        // Delete file document from Firestore
        await deleteDoc(fileDoc.ref).catch((error) => {
          console.error('Error deleting document from Firestore:', error);
        });

        console.log('Deleted expired file:', fileData.url);
      }
    });
  });
});
