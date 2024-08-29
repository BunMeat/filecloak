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

//copy to clipboard
function copyTokenToClipboard(text) {
  navigator.clipboard.writeText(text)
      .then(() => {
          ('Text copied to clipboard:', text);
          alert('Encrypted text has been copied to clipboard!');
      })
      .catch((error) => {
          console.error('Unable to copy encrypted text to clipboard:', error);
      });
}

function copyKeyToClipboard(text) {
  navigator.clipboard.writeText(text)
  .then(() => {
      ('Text copied to clipboard:', text);
      alert('Encryption Key has been copied to clipboard!');
  })
  .catch((error) => {
      console.error('Unable to copy encryption key to clipboard:', error);
  });
}

//copy button call
document.getElementById('copyButton').addEventListener('click', function() {
  const keyGenerated = document.getElementById('keyGen').value;
  copyKeyToClipboard(keyGenerated);
});

document.getElementById('copyButton2').addEventListener('click', function() {
  const encryptedText = document.getElementById('output').value;
  copyTokenToClipboard(encryptedText);
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

//encrypt file
document.getElementById('encryptFileButton').addEventListener('submit', async (e) => {
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

      if (zipFilesCheckbox) {
          //create a zip file if checkbox is checked
          const zip = new JSZip();
          for (let file of files) {
              zip.file(file.name, file); //make sure files are added correctly to the zip
          }

          //generate zip content as a Blob
          const zipContent = await zip.generateAsync({ type: 'blob' });

          //create new blob with the correct MIME type
          fileToUpload = new Blob([zipContent], { type: 'application/x-zip-compressed' });
          fileName = 'files_' + new Date().toISOString().replace(/[:.]/g, '-') + '.zip';
          mimeType = 'application/x-zip-compressed';
          ("fileToUpload", fileToUpload);
          ("fileName", fileName);
          ("mimeType", mimeType);
      } else {
          //take the first file
          fileToUpload = files[0];
          fileName = fileToUpload.name;
          mimeType = fileToUpload.type;
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
      const storageRef = ref(storage, 'uploads/' + fileName);
      ("storageRef", storageRef);

      //set metadata with the correct content type
      const metadata = {
          contentType: mimeType,
      };

      ("metadata", metadata);

      //upload file/zip with metadata
      const snapshot = await uploadBytes(storageRef, fileToUpload, metadata);
      ('Uploaded a blob or file!', snapshot);

      //get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      const encryptedLink = encrypt(downloadURL, key);
      document.getElementById('output').value = encryptedLink;

      //save file data to Firestore
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
          ('File data saved to Firestore:', fileData);
      } else {
          console.error('No user is signed in.');
      }
  } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed: ' + error.message);
  }
});

//encrypt text
document.getElementById('encryptTextButton').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const text = document.getElementById('textToEncrypt').value;
  const key = document.getElementById('keyGen').value.trim();

  if (!key) {
    alert('Please generate or provide an encryption key before proceeding.');
    return;
  }

  try {
    const encryptedText = encrypt(text, key);
    document.getElementById('output').value = encryptedText;

  } catch (error) {
    console.error('Encryption failed', error);
    alert('Encryption failed: ' + error.message);
  }
});