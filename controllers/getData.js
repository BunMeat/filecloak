// Import Firebase modules
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASEKEY,
  authDomain: process.env.FIREBASEAUTHDOMAIN,
  projectId: process.env.PROJECTID,
  storageBucket: process.env.STORAGEBUCKET,
  messagingSenderId: process.env.MESSAGINGSENDERID,
  appId: process.env.APPID
};

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);

// Function to get data from Firestore
async function getDataFile() {
  const usersCollection = collection(firestore, "users");
  const usersSnapshot = await getDocs(usersCollection);
  const data = [];

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const filesCollection = collection(firestore, `users/${userDoc.id}/files`);
    const filesSnapshot = await getDocs(filesCollection);

    if (filesSnapshot.empty) {
      // User without files
      data.push({
        email: userData.email,
        files: []
      });
    } else {
      // User with files
      const userFiles = [];
      filesSnapshot.forEach(fileDoc => {
        const fileData = fileDoc.data();
        userFiles.push(fileData);
      });
      data.push({
        email: userData.email,
        files: userFiles
      });
    }
  }
  return data;
}

export { getDataFile };
