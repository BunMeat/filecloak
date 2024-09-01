import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore, collection, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js';

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
const storage = getStorage(firebaseApp);

const encryptForm = document.getElementById('encryptForm');

//encrypt function
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

function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
  .then(() => {
      ('Text copied to clipboard:', text);
      alert('Text has been copied to clipboard!');
  })
  .catch((error) => {
      console.error('Unable to copy to clipboard:', error);
  });
}

//copy button call
document.getElementById('copyButton').addEventListener('click', function() {
  const keyGenerated = document.getElementById('keyGen').value;
  copyToClipboard(keyGenerated);
});

//generate key
document.getElementById('keyGenButton').addEventListener('click', function() {
  const randomBytes = CryptoJS.lib.WordArray.random(32); 
  document.getElementById('keyGen').value = randomBytes.toString(CryptoJS.enc.Hex).slice(0, 32);
});

const keyGenLength = document.getElementById('keyGen');
const counter = document.getElementById('counter');

keyGen.addEventListener('input', updateCounter);

//update char count
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

//encrypt form
encryptForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('fileInput');
  const files = fileInput.files;
  const key = document.getElementById('keyGen').value.trim();
  const zipFilesCheckbox = document.getElementById('zipFilesCheckbox').checked;

  if (!key) {
    alert('Please generate or provide an encryption key before proceeding.');
    return;
  }

  try {
    let fileToUpload;
    let fileName;
    let mimeType;
    const encryptedLinks = [];

    if (zipFilesCheckbox) {
      // Create a zip file if checkbox is checked
      const zip = new JSZip();
      for (let file of files) {
        zip.file(file.name, file); // Add files to the zip
      }

      // Generate zip content as a Blob
      const zipContent = await zip.generateAsync({ type: 'blob' });

      // Convert the Blob content to a WordArray for encryption
      const reader = new FileReader();
      reader.readAsArrayBuffer(zipContent);
      await new Promise((resolve) => (reader.onloadend = resolve));
      const wordArray = CryptoJS.lib.WordArray.create(reader.result);

      // Encrypt the zip content using the provided key
      const encryptedContent = encrypt(wordArray, key);

      // Create a Blob from the encrypted content for uploading
      const encryptedBlob = new Blob([CryptoJS.enc.Base64.parse(encryptedContent.split(':')[0])], {
        type: 'application/x-zip-compressed',
      });

      // Generate a unique file name for the encrypted zip file
      fileName = 'encrypted_files_' + new Date().toISOString().replace(/[:.]/g, '-') + '.zip';
      mimeType = 'application/x-zip-compressed';
      fileToUpload = encryptedBlob;
    } else {
      // Encrypt and upload each file individually if not zipping
      for (const file of files) {
        const fileText = await file.text();
        const encryptedContent = encrypt(CryptoJS.enc.Utf8.parse(fileText), key); // Use your encrypt function here

        // Convert the encrypted content back to a Blob
        const encryptedBlob = new Blob([CryptoJS.enc.Base64.parse(encryptedContent.split(':')[0])], { type: file.type });

        // Generate a unique file name for each encrypted file
        const encryptedFileName = 'encrypted_' + file.name;

        // Upload the encrypted file
        const fileRef = ref(storage, `uploads/${encryptedFileName}`);
        await uploadBytes(fileRef, encryptedBlob);

        // Get the download URL of the uploaded file
        const downloadURL = await getDownloadURL(fileRef);

        // Encrypt the download URL for sharing
        const encryptedLink = encrypt(downloadURL, key);
        encryptedLinks.push(encryptedLink);

        // Store metadata in Firestore for each file
        const user = auth.currentUser;
        if (user) {
          const userCollection = collection(firestore, "users");
          const userRefDoc = doc(userCollection, user.uid);
          const filesSubCollection = collection(userRefDoc, "files");
          const fileDocRef = doc(filesSubCollection);

          const fileData = {
            timestamp: new Date().toISOString(),
            url: downloadURL,
            encryptUrl: encryptedLink,
          };

          await setDoc(fileDocRef, fileData);
        } else {
          console.error('No user is signed in.');
        }
      }
    }

    // Upload the encrypted file/zip with metadata
    if (fileToUpload) {
      const storageRef = ref(storage, `uploads/${fileName}`);
      const metadata = {
        contentType: mimeType,
      };

      const snapshot = await uploadBytes(storageRef, fileToUpload, metadata);
      console.log('Uploaded an encrypted blob or file!', snapshot);

      // Get download URL for the uploaded encrypted zip file
      const downloadURL = await getDownloadURL(snapshot.ref);
      const encryptedLink = encrypt(downloadURL, key);
      encryptedLinks.push(encryptedLink);
    }

    // Display encrypted links in the UI
    const encryptedOutputsContainer = document.getElementById('encryptedOutputsContainer');
    encryptedOutputsContainer.innerHTML = '';
    encryptedLinks.forEach((link, index) => {
      const outputContainer = document.createElement('div');
      outputContainer.style.marginTop = '15px';

      const outputTextArea = document.createElement('textarea');
      outputTextArea.value = link;
      outputTextArea.rows = 3;
      outputTextArea.cols = 50;

      const copyButton = document.createElement('button');
      copyButton.textContent = 'Copy to Clipboard';
      copyButton.addEventListener('click', () => {
        copyToClipboard(link);
      });

      outputContainer.appendChild(outputTextArea);
      outputContainer.appendChild(copyButton);

      encryptedOutputsContainer.appendChild(outputContainer);
    });

    encryptedOutputsContainer.style.marginBottom = '15px';

    alert('Files have been encrypted, uploaded, and metadata stored successfully!');
  } catch (error) {
    console.error('Upload failed', error);
    alert('Upload failed: ' + error.message);
  }
});

