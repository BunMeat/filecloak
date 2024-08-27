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

const keyGenLength = document.getElementById('keyGen');
const counter = document.getElementById('counter');

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
  const text = document.getElementById('textToEncrypt');
  const key = document.getElementById('keyGen').value;

  if (!key) {
    alert('Please generate or provide an encryption key before proceeding.');
    return;
  }

  try {
    const encryptedText = encrypt(downloadURL, key);
    document.getElementById('output').value = encryptedText;

  } catch (error) {
    console.error('Upload failed', error);
    alert('Upload failed: ' + error.message);
  }
});
