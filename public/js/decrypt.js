import { initializeApp as initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth as getAuth } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';

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

function decrypt(encryptedText, key) {
  const encryptKey = CryptoJS.enc.Utf8.parse(key);
  const ivString = encryptedText.slice(-24); 
  const encryptIV = CryptoJS.enc.Base64.parse(ivString);
  encryptedText = encryptedText.slice(0, -24);

  const decrypted = CryptoJS.AES.decrypt(
    encryptedText,
    encryptKey,
    { iv: encryptIV }
  );

  const decryptedURL = decrypted.toString(CryptoJS.enc.Utf8);
  return decryptedURL;
}
decryptForm.addEventListener('submit', async (e) =>{
  e.preventDefault();
  const user = auth.currentUser;
    if(user.role === "user"){
      window.location.href = "../html/userPage.html";
    }
  const encryptET = document.getElementById('tokenInput').value;
  const keyET = document.getElementById('keyInput').value;
  const decryptET = document.getElementById('output');
  decryptET.value = decrypt(encryptET, keyET);
})

