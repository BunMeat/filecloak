import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore, collection, doc, getDocs } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

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

// Function to export decrypted URL and note to a .txt file
function exportToTxt(decryptedURL, decryptedNote) {
  const text = `Decrypted URL: ${decryptedURL}\n\nDecrypted Note: ${decryptedNote}`;
  const blob = new Blob([text], { type: 'text/plain' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'decrypted_data.txt'; // Name of the .txt file
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Function to export decrypted URL and note to a .txt file
function exportToTxt2(decryptedText) {
  const text = `Decrypted Text: ${decryptedText}`;
  const blob = new Blob([text], { type: 'text/plain' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'decrypted_data.txt'; // Name of the .txt file
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

decryptForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Get the encrypted token and decryption key from the form
  const encryptET = document.getElementById('tokenInput').value;
  const keyET = document.getElementById('keyInput').value;

  // Decrypt the URL
  const decryptedURL = decrypt(encryptET, keyET);
  console.log("1");

  try {
    const user = auth.currentUser;
    if (user) {
      const userCollection = collection(firestore, "users");
      const userRefDoc = doc(userCollection, user.uid);
      const filesSubCollection = collection(userRefDoc, "files");
  
      // Retrieve all documents in the "files" subcollection
      const querySnapshot = await getDocs(filesSubCollection);
      console.log("2");
  
      let foundFile = null;
      querySnapshot.forEach((doc) => {
        // Find the document with an encryption token matching the input
        if (doc.data().encryptUrl === encryptET) {
          foundFile = doc.data();
          console.log("foundFile", foundFile);
        }
      });

      if (foundFile) {
        // Decrypt the note using the same key
        const encryptedNote = foundFile.encryptNote;
        const decryptedNoteText = decrypt(encryptedNote, keyET);
        console.log("decryptedNoteText", decryptedNoteText);
  
        // Export the decrypted note to a .txt file
        exportToTxt(decryptedURL, decryptedNoteText);
      } else {
        const decryptedText = decrypt(encryptET, keyET);
        console.log("3");
        exportToTxt2(decryptedText);
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
