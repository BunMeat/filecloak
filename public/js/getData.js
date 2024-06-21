import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: window.env.FIREBASEKEY,
  authDomain: window.env.FIREBASEAUTHDOMAIN,
  projectId: window.env.PROJECTID,
  storageBucket: window.env.STORAGEBUCKET,
  messagingSenderId: window.env.MESSAGINGSENDERID,
  appId: window.env.APPID
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
