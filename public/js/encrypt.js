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

const dropArea = document.getElementById('dropArea');
const fileInput = document.getElementById('fileInput');
let files;

// Prevent default behaviors for drag events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
});

// Highlight the drop area when dragging files
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
        dropArea.classList.add('dragging');
    });
});

// Remove highlight when the drag leaves the drop area
['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, () => {
        dropArea.classList.remove('dragging');
    });
});

// Handle files when they are dropped
dropArea.addEventListener('drop', (e) => {
    files = e.dataTransfer.files; // Get the dropped files
    displayFileNames(files); // Show the names of dropped files
    fileInput.files = files; // Set the files to the hidden input
});

// Also allow clicking on the drop area to trigger the file input dialog
dropArea.addEventListener('click', () => {
    fileInput.click(); // Open the file picker when clicking the drop area
});

fileInput.addEventListener('change', (e) => {
    files = e.target.files; // Update files when using file picker
    displayFileNames(files); // Display selected files
});

// Helper function to show file names in the drop area
function displayFileNames(files) {
    let fileNames = Array.from(files).map(file => file.name).join(', ');
    dropArea.innerHTML = `<p>Files Selected: ${fileNames}</p>`;
}


//copy button call
document.getElementById('copyButton').addEventListener('click', function() {
  const keyGenerated = document.getElementById('keyGen').value;
  copyToClipboard(keyGenerated);
});

//generate key
document.getElementById('keyGenButton').addEventListener('click', function() {
  const randomBytes = CryptoJS.lib.WordArray.random(32);
  document.getElementById('keyGen').value =randomBytes.toString();
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
async function storeMetadataInFirestore(userId, encryptedLink, encryptedNote) {
  try {
    const userCollection = collection(firestore, "users");
    const userRefDoc = doc(userCollection, userId);
    const filesSubCollection = collection(userRefDoc, "files");

    const encryptedFilesCollection = collection(firestore, "encryptedFiles");
    const encryptedFilesRefDoc = doc(encryptedFilesCollection, userId);

    // Create a unique document ID based on the timestamp
    const fileDocRef = doc(filesSubCollection, Date.now().toString());

    const fileData = {
      timestamp: new Date().toISOString(),
      encryptNote: encryptedNote,
      encryptUrl: encryptedLink,
    };

    // Store metadata in Firestore
    await setDoc(fileDocRef, fileData);
    await setDoc(encryptedFilesRefDoc, fileData);
    console.log('File data saved to Firestore:', fileData);
  } catch (error) {
    console.error('Failed to save file metadata to Firestore:', error);
  }
}

// Updated function to export encrypted links along with the key
function exportEncryptedLinksToFile(encryptedLinks, encryptionKey, fileNames) {
  // Start the file content with the encryption key and a separator
  let fileContent = `Encryption Key: ${encryptionKey}\n\nEncryption Tokens:\n\n`;

  // Append each file name and its corresponding encrypted link to the file content
  encryptedLinks.forEach((encryptedLink, index) => {
    fileContent += `File: ${fileNames[index]}\nEncrypted URL: ${encryptedLink}\n\n`;
  });

  // Create a Blob with the file content and set the MIME type to text/plain
  const blob = new Blob([fileContent], { type: 'text/plain' });

  // Create a temporary link element
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'encrypted_links.txt';

  // Append the link to the document, click it to start the download, and then remove it
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function displayEncryptedLink(encryptedLinks, fileNames) {
  const encryptedOutputsContainer = document.getElementById('encryptedOutputsContainer');
  encryptedOutputsContainer.innerHTML = ''; // Clear previous outputs

  encryptedLinks.forEach((encryptedLink, index) => {
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
    copyButton.type = 'button'; // Prevent form submission
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
    exportButton.type = 'button'; // Prevent form submission
    exportButton.style.marginTop = '10px';
    exportButton.addEventListener('click', () => {
      const encryptionKey = document.getElementById('keyGen').value.trim(); // Get the encryption key from the input field
      exportEncryptedLinksToFile(encryptedLinks, encryptionKey, fileNames); // Pass fileNames correctly here
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
  const note = document.getElementById('note').value;

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
    const fileNames = [];

    if (zipFilesCheckbox) {
      // Case 1: Zip and encrypt multiple files
      const zip = new JSZip();
      for (let file of files) {
        zip.file(file.name, file);
        fileNames.push(file.name);
      }

      // Generate zip content as a Blob
      const zipContent = await zip.generateAsync({ type: 'blob' });
      fileName = 'files_' + new Date().toISOString().replace(/[:.]/g, '-') + '.zip';
      mimeType = 'application/x-zip-compressed';
      fileToUpload = zipContent;

      const storageRef = ref(storage, 'uploads/' + fileName);

      // Upload to Firebase Storage
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      console.log('Uploaded zip file to Firebase Storage!', snapshot);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL for the zip file:', downloadURL);

      // Encrypt the download URL and note
      const encryptedLink = encrypt(downloadURL, key);
      const encryptedNote = encrypt(note, key);

      // Display the encrypted URL
      displayEncryptedLink([encryptedLink], fileNames);

      // Store metadata in Firestore
      await storeMetadataInFirestore(user.uid, encryptedLink, encryptedNote);
    } else {
      // Case 2: Encrypt and upload each file individually
      for (const file of files) {
        const uniqueFileName = `${Date.now()}_${file.name}`;
        const fileRef = ref(storage, `uploads/${uniqueFileName}`);

        // Upload to Firebase Storage
        await uploadBytes(fileRef, file);
        console.log(`Uploaded file ${file.name} as ${uniqueFileName} to Firebase Storage`);

        // Get the download URL
        const downloadURL = await getDownloadURL(fileRef);
        console.log(`Download URL for file ${file.name}:`, downloadURL);

        // Encrypt the download URL and note
        const encryptedLink = encrypt(downloadURL, key);
        const encryptedNote = encrypt(note, key);
        encryptedLinks.push(encryptedLink);
        fileNames.push(file.name);

        // Store metadata in Firestore
        await storeMetadataInFirestore(user.uid, encryptedLink, encryptedNote);
      }

      // Display all encrypted URLs
      displayEncryptedLink(encryptedLinks, fileNames);
    }

    alert('Files have been processed successfully!');
  } catch (error) {
    console.error('Upload failed', error);
    alert('Upload failed: ' + error.message);
  }
});