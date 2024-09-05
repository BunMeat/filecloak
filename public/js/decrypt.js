import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore, collection, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

//firebase
const firebaseConfig = {
  apiKey: window.env.FIREBASEKEY,
  authDomain: window.env.FIREBASEAUTHDOMAIN,
  projectId: window.env.PROJECTID,
  storageBucket: window.env.STORAGEBUCKET,
  messagingSenderId: window.env.MESSAGINGSENDERID,
  appId: window.env.APPID
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

const decryptForm = document.getElementById('decryptForm');

function copyLinkToClipboard(text) {
  navigator.clipboard.writeText(text)
      .then(() => {
          alert('File URL has been copied to clipboard!');
      })
      .catch((error) => {
          console.error('Unable to copy file URL to clipboard:', error);
      });
}

document.getElementById('copyButton').addEventListener('click', function() {
  const fileLink = document.getElementById('output').value;
  copyLinkToClipboard(fileLink);
});

// Decrypt function for URL and notes
function decrypt(encryptedText, key) {
  const encryptKey = CryptoJS.enc.Utf8.parse(key);
  const ivString = encryptedText.slice(-24);  // Extract the IV from the encryptedText
  const encryptIV = CryptoJS.enc.Base64.parse(ivString);
  encryptedText = encryptedText.slice(0, -24); // Remove IV part from encryptedText

  const decrypted = CryptoJS.AES.decrypt(
    encryptedText,
    encryptKey,
    { iv: encryptIV }
  );

  const decryptedData = decrypted.toString(CryptoJS.enc.Utf8);
  return decryptedData;
}

decryptForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get the encrypted token and decryption key from the form
  const encryptET = document.getElementById('tokenInput').value;
  const keyET = document.getElementById('keyInput').value;
  const decryptET = document.getElementById('output');
  const decryptedNote = document.getElementById('note');

  // Decrypt the URL
  const decryptedURL = decrypt(encryptET, keyET);
  decryptET.value = decryptedURL; // Show the decrypted URL in the output field

  try {
    // Query Firestore for the file data based on the decrypted URL
    const user = auth.currentUser;
    if (user) {
      const userCollection = collection(firestore, "users");
      const userRefDoc = doc(userCollection, user.uid);
      const filesSubCollection = collection(userRefDoc, "files");

      // Retrieve all documents in the "files" subcollection
      const querySnapshot = await getDocs(filesSubCollection);

      let foundFile = null;
      querySnapshot.forEach((doc) => {
        // Find the document with a URL matching the decrypted URL
        if (doc.data().url === decryptedURL) {
          foundFile = doc.data();
        }
      });

      if (foundFile) {
        // Decrypt the note using the same key
        const encryptedNote = foundFile.encryptNote;
        const decryptedNoteText = decrypt(encryptedNote, keyET);
        decryptedNote.value = decryptedNoteText; // Set the decrypted note in the note field
      } else {
        console.error('No matching document found for the decrypted URL.');
        alert('No matching document found.');
      }
    } else {
      console.error('No user is signed in.');
      alert('You need to sign in to decrypt the note.');
    }
  } catch (error) {
    console.error('Error retrieving note from Firestore:', error);
    alert('Error retrieving note: ' + error.message);
  }
});
