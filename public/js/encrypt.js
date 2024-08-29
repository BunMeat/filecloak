import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore, collection, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js';

//initialize Firebase
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
  
  //concat the IV in Base64 format with the encrypted text
  return encrypted + ':' + encryptIV.toString(CryptoJS.enc.Base64);
}

//copy to clipboard function
function copyToClipboard(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      alert('Text has been copied to clipboard!');
    })
    .catch((error) => {
      console.error('Unable to copy text to clipboard:', error);
    });
}

//event listener for copy key button
document.getElementById('copyButton').addEventListener('click', function() {
  const keyGenerated = document.getElementById('keyGen').value;
  copyToClipboard(keyGenerated);
});

//generate encryption key
document.getElementById('keyGenButton').addEventListener('click', function() {
  const randomBytes = CryptoJS.lib.WordArray.random(32); 
  document.getElementById('keyGen').value = randomBytes.toString(CryptoJS.enc.Hex).slice(0, 32);
});

const keyGenLength = document.getElementById('keyGen');
const counter = document.getElementById('counter');

keyGen.addEventListener('input', updateCounter);

function updateCounter() {
  const currentLength = keyGenLength.value.length;
  const maxLength = parseInt(keyGenLength.getAttribute('maxlength'));
  counter.textContent = currentLength;
  counter.style.color = currentLength > maxLength ? 'red' : 'black';
}

//encrypt form submission
encryptForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('fileInput');
  const files = fileInput.files;
  const key = document.getElementById('keyGen').value.trim();
  const zipFilesCheckbox = document.getElementById('zipFilesCheckbox').checked;

  if (!key) {
    alert('Please provide a valid 32-character encryption key.');
    return;
  }

  if (files.length === 0) {
    alert('Please select at least one file to upload.');
    return;
  }

  //generate zip file if the checkbox is checked
  let uploadFiles = [];
  if (zipFilesCheckbox) {
    const zip = new JSZip();
    for (const file of files) {
      zip.file(file.name, file);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    uploadFiles = [{ name: 'encrypted_files.zip', file: zipBlob }];
  } else {
    uploadFiles = Array.from(files).map(file => ({ name: file.name, file }));
  }

  try {
    const encryptedLinks = [];

    for (const { name, file } of uploadFiles) {
      const encryptedFile = new Blob([encrypt(await file.text(), key)], { type: file.type });
      const fileRef = ref(storage, `encrypted/${name}`);
      await uploadBytes(fileRef, encryptedFile);
      const downloadURL = await getDownloadURL(fileRef);

      //push the download URL to encryptedLinks
      encryptedLinks.push(downloadURL);
    }

    //display each encrypted link in a separate text area with a copy button
    const encryptedOutputsContainer = document.getElementById('encryptedOutputsContainer');
    encryptedOutputsContainer.innerHTML = '';  //clear previous outputs
    encryptedLinks.forEach((link, index) => {
      const outputContainer = document.createElement('div');

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

    alert('Files have been encrypted and uploaded successfully!');
  } catch (error) {
    console.error('An error occurred during the encryption or upload process:', error);
    alert('An error occurred. Please try again.');
  }
});
