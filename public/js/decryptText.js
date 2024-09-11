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
  const encryptET = document.getElementById('tokenInput').value;
  const keyET = document.getElementById('keyInput').value;
  const decryptET = document.getElementById('output');
  decryptET.value = decrypt(encryptET, keyET);
})