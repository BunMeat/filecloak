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
    const user = userCredential.user;

    // Fetch user document from Firestore
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    
    // Check if the user is blocked
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      if (userData.isBlocked === "blocked") {
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
      try {
        console.log("3");
        const querySnapshot = await getDocs(
          query(collection(firestore, 'users'), where('email', '==', email))
        );
        console.log("4");
        
        if (!querySnapshot.empty) {
          console.log("5");
          const userDoc = querySnapshot.docs[0];  // Get the first matching document
          const userId = userDoc.id;  // Use the document ID as UID
      
          // Now that you have the UID, block the user by sending it to the backend
          const response = await fetch('/api/blockUser', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer <vCqqWRTt0HwBkWdt0fpS5reW>`,  // Use a valid token
            },
            body: JSON.stringify({ userId })  // Send the UID to block
          });
          console.log("6");
          
          if (response.ok) {
            console.log('User notified for blocking.');
          } else {
            console.error('Failed to notify backend:', response.statusText);
          }
        } else {
          console.error('No user found with this email.');
        }
      } catch (err) {
        console.error('Error fetching user UID from Firestore:', err);
      }      
    } else {
      console.error('Login error: ', errorMsg);
      alert("Kesalahan Server: " + errorMsg);
    }
  }
});

