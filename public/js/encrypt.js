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

// Helper function to store metadata in Firestore
async function storeMetadataInFirestore(userId, downloadURL, encryptedLink) {
  try {
    const userCollection = collection(firestore, "users");
    const userRefDoc = doc(userCollection, userId);
    const filesSubCollection = collection(userRefDoc, "files");
    const fileDocRef = doc(filesSubCollection);

    const fileData = {
      timestamp: new Date().toISOString(),
      url: downloadURL,
      encryptUrl: encryptedLink,
    };

    await setDoc(fileDocRef, fileData);
    console.log('File data saved to Firestore:', fileData);
  } catch (error) {
    console.error('Failed to save file metadata to Firestore:', error);
  }
}

// Function to export encrypted links to a .txt file
function exportEncryptedLinksToFile(encryptedLinks) {
  if (encryptedLinks.length === 0) {
    alert('No encrypted links to export!');
    return;
  }

  // Create a blob from the encrypted links array
  const blob = new Blob([encryptedLinks.join('\n')], { type: 'text/plain' });

  // Create a link element to trigger the download
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'encrypted_links.txt';
  a.click();

  // Clean up by revoking the object URL
  URL.revokeObjectURL(a.href);
}


// Helper function to display multiple encrypted links
function displayEncryptedLink(encryptedLinks) {
  const encryptedOutputsContainer = document.getElementById('encryptedOutputsContainer');
  encryptedOutputsContainer.innerHTML = ''; // Clear previous outputs

  encryptedLinks.forEach((encryptedLink) => {
    // Create a container for each encrypted link
    const linkContainer = document.createElement('div');
    linkContainer.style.marginTop = '15px';

    const outputTextArea = document.createElement('textarea');
    outputTextArea.value = encryptedLink;
    outputTextArea.rows = 3;
    outputTextArea.cols = 50;
    outputTextArea.readOnly = true; // Make the textarea read-only

    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy to Clipboard';
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(encryptedLink)
        .then(() => alert('Encrypted URL copied to clipboard!'))
        .catch(err => console.error('Failed to copy: ', err));
    });

    linkContainer.appendChild(outputTextArea);
    linkContainer.appendChild(copyButton);
    encryptedOutputsContainer.appendChild(linkContainer);
  });

  // Add the export button if it doesn't exist
  if (!document.getElementById('exportButton')) {
    const exportButton = document.createElement('button');
    exportButton.textContent = 'Export to .txt';
    exportButton.id = 'exportButton'; // Add an ID for easy reference
    exportButton.style.marginTop = '10px';
    exportButton.addEventListener('click', () => {
      exportEncryptedLinksToFile(encryptedLinks);
    });

    encryptedOutputsContainer.appendChild(exportButton);
  }

  encryptedOutputsContainer.style.marginBottom = '15px';
}

encryptForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById('fileInput');
  const files = fileInput.files;
  const key = document.getElementById('keyGen').value.trim();
  const zipFilesCheckbox = document.getElementById('zipFilesCheckbox').checked;

  // Check user authentication
  const user = auth.currentUser;
  if (!user) {
    alert('Please sign in to continue.');
    return;
  }

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
      // Case 1: Zip and encrypt multiple files
      const zip = new JSZip();
      for (let file of files) {
        zip.file(file.name, file); // Add files to the zip
      }

      // Generate zip content as a Blob
      const zipContent = await zip.generateAsync({ type: 'blob' });

      // Set up for Firebase Storage upload
      fileName = 'files_' + new Date().toISOString().replace(/[:.]/g, '-') + '.zip';
      mimeType = 'application/x-zip-compressed';
      fileToUpload = zipContent;

      const storageRef = ref(storage, 'uploads/' + fileName);

      // Step 1: Upload to Firebase Storage
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      console.log('Uploaded zip file to Firebase Storage!', snapshot);

      // Step 2: Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL for the zip file:', downloadURL);

      // Step 3: Encrypt the download URL
      const encryptedLink = encrypt(downloadURL, key);

      // Step 4: Display the encrypted URL
      displayEncryptedLink([encryptedLink]); // Wrap in array

      // Step 5: Store metadata in Firestore
      await storeMetadataInFirestore(user.uid, downloadURL, encryptedLink);
    } else {
      // Case 2: Encrypt and upload each file individually
      for (const file of files) {
        // Generate a unique file name using the original file name and a timestamp
        const uniqueFileName = `${Date.now()}_${file.name}`;

        // Set up for Firebase Storage upload
        const fileRef = ref(storage, `uploads/${uniqueFileName}`);

        // Step 1: Upload to Firebase Storage
        await uploadBytes(fileRef, file);
        console.log(`Uploaded file ${file.name} as ${uniqueFileName} to Firebase Storage`);

        // Step 2: Get the download URL
        const downloadURL = await getDownloadURL(fileRef);
        console.log(`Download URL for file ${file.name}:`, downloadURL);

        // Step 3: Encrypt the download URL
        const encryptedLink = encrypt(downloadURL, key);
        encryptedLinks.push(encryptedLink);

        // Step 4: Store metadata in Firestore
        await storeMetadataInFirestore(user.uid, downloadURL, encryptedLink);
      }

      // Display all encrypted URLs
      displayEncryptedLink(encryptedLinks);
    }

    alert('Files have been processed successfully!');
  } catch (error) {
    console.error('Upload failed', error);
    alert('Upload failed: ' + error.message);
  }
});