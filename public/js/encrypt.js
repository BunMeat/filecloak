import { initializeApp as initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth as getAuth } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore as getFirestore, collection as collection, doc as doc, setDoc as setDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';
import { getStorage as getStorage, ref as ref, uploadBytes as uploadBytes, getDownloadURL as getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js';

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
const storage = getStorage(firebaseApp);

const encryptForm = document.getElementById('encryptForm');

function encrypt(text, key) {
  if (key.length !== 32) {
    throw new Error('Invalid key length. Key must be 32 characters long.');
  }

  const encryptKey = CryptoJS.enc.Utf8.parse(key);
  const encryptIV = CryptoJS.lib.WordArray.random(16);

  const encrypted = CryptoJS.AES.encrypt(text, encryptKey, { iv: encryptIV }).toString();
  
  // Concatenate the IV in Base64 format with the encrypted text
  return encrypted + ':' + encryptIV.toString(CryptoJS.enc.Base64);
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
  document.getElementById('keyGen').value = randomBytes.toString(CryptoJS.enc.Hex).slice(0, 32);
});

keyGen.addEventListener('input', updateCounter);

function updateCounter() {
  const currentLength = keyGenLength.value.length;
  const maxLength = parseInt(keyGenLength.getAttribute('maxlength'));
  
  counter.textContent = currentLength;
  
  if (currentLength > maxLength) {
    counter.style.color = 'red';
  } else {
    counter.style.color = 'black';
  }
}

encryptForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  const key = document.getElementById('keyGen').value.trim();

  if (!key) {
    alert('Please generate or provide an encryption key before proceeding.');
    return;
  }

  const currentDatetime = new Date();
  const options = { 
    timeZone: 'Asia/Jakarta', 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  };
  const formattedDatetime = new Intl.DateTimeFormat('en-GB', options).format(currentDatetime);
  const storageRef = ref(storage, 'uploads/' + file.name + '-' + formattedDatetime.replace(/[:\s]/g, '-'));

  try {
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Uploaded a blob or file!', snapshot);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    const encryptedLink = encrypt(downloadURL, key);
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
