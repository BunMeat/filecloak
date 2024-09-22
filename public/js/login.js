import { initializeApp as initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth as getAuth, signInWithEmailAndPassword as signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore as getFirestore, doc as doc, getDoc as getDoc, getDocs as getDocs, query as query, collection as collection, where as where } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

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

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('emailLogin').value;
  const password = document.getElementById('passwordLogin').value;

  try {
    // Firebase Authentication login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Fetch user document from Firestore
    const userDoc = await getDoc(doc(firestore, 'users', email));
    
    // Check if the user is blocked
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      if (userData.isBlocked === true) {
        console.log("1");
        alert("Your account is blocked. Contact support.");
        return; // Prevent further actions if the account is blocked
      }

      // Redirect based on user role
      if (userData.role === "user") {
        alert("Sukses Login");
        window.location.href = "../html/userPage.html";
      } else {
        alert("Sukses Login");
        window.location.href = "../html/adminPageEncrypt.html";
      }
    } else {
      alert("Email / Password Salah");
    }
  } catch (error) {
    const errorCode = error.code;
    const errorMsg = error.message;

    // If wrong password or invalid credential
    if (errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
      console.log("2");
      console.error('Wrong password or invalid credential, notifying server...');

      // Fetch user UID from Firestore based on the email
      // Fetch user document from Firestore using the email as the document ID
      const userRefDoc = doc(firestore, 'users', email);

      try {
        const userDoc = await getDoc(userRefDoc);
        console.log("3");
      
        if (userDoc.exists()) {
          console.log("4");
          const userData = userDoc.data();
      
          if (userData.isBlocked === false) { 
            console.log("5");
            console.log("User is not blocked.");
      
            // Check the number of login attempts from userData or another source
            if (userData.loginAttempts >= 3) {
              console.log("6");
              console.log("User exceeded allowed login attempts, blocking user...");
      
              // Call the blockUser API
              const response = await fetch('/api/blockUser', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userData.uid }) // Send userId to block the user
              });
              console.log("7");
      
              if (response.ok) {
                console.log('User successfully blocked.');
                alert("Your account has been blocked due to multiple failed login attempts.");
              } else {
                console.error('Failed to block user:', response.statusText);
              }
            } else {
              // Proceed with login or other actions if user is not blocked and hasn't exceeded attempts
              console.log("Proceeding with login...");
            }
          } else {
            alert("Your account is blocked. Contact support.");
          }
        } else {
          console.error('User document not found.');
        }
      } catch (err) {
        console.error('Error fetching user document from Firestore:', err);
      }
      

    } else {
      console.error('Login error: ', errorMsg);
      alert("Kesalahan Server: " + errorMsg);
    }
  }
});

