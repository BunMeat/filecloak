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

function decrypt(encryptedBase64, key) {
  if (key.length !== 32) {
    throw new Error('Invalid key length. Key must be 32 characters long.');
  }
  const [encryptedData, iv] = encryptedBase64.split(':');

  const decryptKey = CryptoJS.enc.Utf8.parse(key);
  const decryptIV = CryptoJS.enc.Base64.parse(iv);
  const encryptedWordArray = CryptoJS.enc.Base64.parse(encryptedData);

  const decrypted = CryptoJS.AES.decrypt(
    { ciphertext: encryptedWordArray },
    decryptKey,
    { iv: decryptIV }
  );

  return decrypted;
}

function wordArrayToString(wordArray) {
  return CryptoJS.enc.Utf8.stringify(wordArray);
}

decryptForm.addEventListener('submit', async (e) =>{
  e.preventDefault();
  const encryptET = document.getElementById('tokenInput').value;
  const keyET = document.getElementById('keyInput').value;
  const decryptET = document.getElementById('output');
  const decryptedText = decrypt(encryptET, keyET);
  decryptET.value = wordArrayToString(decryptedText);
})

