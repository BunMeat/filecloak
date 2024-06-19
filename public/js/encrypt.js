import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.FIREBASEKEY,
  authDomain: process.env.FIREBASEAUTHDOMAIN,
  projectId: process.env.PROJECTID,
  storageBucket: process.env.STORAGEBUCKET,
  messagingSenderId: process.env.MESSAGINGSENDERID,
  appId: process.env.APPID
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const encryptForm = document.getElementById('encryptForm');

function encrypt(text, key) {
  const encryptKey = CryptoJS.enc.Utf8.parse(key); 
  const encryptIV = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(text, encryptKey, { iv: encryptIV }).toString();
  return encrypted + encryptIV.toString(CryptoJS.enc.Base64);
}

function copyTokenToClipboard(text) {
  navigator.clipboard.writeText(text)
      .then(() => {
          console.log('Text copied to clipboard:', text);
          alert('Encrypted text has been copied to clipboard!');
      })
      .catch((error) => {
          console.error('Unable to copy encrypted text to clipboard:', error);
      });
}

function copyKeyToClipboard(text) {
  navigator.clipboard.writeText(text)
  .then(() => {
      console.log('Text copied to clipboard:', text);
      alert('Encryption Key has been copied to clipboard!');
  })
  .catch((error) => {
      console.error('Unable to copy encryption key to clipboard:', error);
  });
}

document.getElementById('copyButton').addEventListener('click', function() {
  const keyGenerated = document.getElementById('keyGen').value;
  copyKeyToClipboard(keyGenerated);
});

document.getElementById('copyButton2').addEventListener('click', function() {
  const encryptedText = document.getElementById('output').value;
  copyTokenToClipboard(encryptedText);
});

document.getElementById('keyGenButton').addEventListener('click', function() {
  const randomBytes = CryptoJS.lib.WordArray.random(32);
  document.getElementById('keyGen').value = randomBytes.toString();
});

encryptForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  const currentDatetime = new Date();
  const formattedDatetime = currentDatetime.toLocaleString();
  const storageRef = ref(storage, 'uploads/' + file.name + '-' + formattedDatetime);

  try {
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Uploaded a blob or file!', snapshot);

    // Get download URL
    const key = document.getElementById('keyGen').value;
    console.log(key);
    const downloadURL = await getDownloadURL(snapshot.ref);
    const encryptedLink = encrypt(downloadURL, key);
    console.log(encryptedLink);
    document.getElementById('output').value = encryptedLink;

    // Get the current user
    const user = auth.currentUser;
    if (user) {
      const userCollection = collection(firestore, "users");
      const userRefDoc = doc(userCollection, user.uid);
      const filesSubCollection = collection(userRefDoc, "files");
      const fileDocRef = doc(filesSubCollection);

      const fileData = {
        timestamp: formattedDatetime,
        url: downloadURL,
        encryptUrl: encryptedLink
      };

      await setDoc(fileDocRef, fileData);
      console.log('File data saved to Firestore:', fileData);
    } else {
      console.error('No user is signed in.');
    }
  } catch (error) {
    console.error('Upload failed', error);
    alert('Upload failed: ' + error.message);
  }
});

  