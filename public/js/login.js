import { initializeApp as initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth as getAuth, signInWithEmailAndPassword as signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore as getFirestore, doc as doc, getDoc as getDoc, updateDoc as updateDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

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
    // Get the user's Firestore document
    const userQuery = doc(firestore, 'users', email); // Assuming email is the document ID in Firestore
    const userDoc = await getDoc(userQuery);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentTime = new Date();

      // Check if the account is locked
      if (userData.lockUntil && userData.lockUntil.toDate() > currentTime) {
        const remainingTime = Math.ceil((userData.lockUntil.toDate() - currentTime) / 1000 / 60); // Calculate remaining lock time in minutes
        alert(`Your account is locked. Please try again after ${remainingTime} minutes.`);
        return;
      }

      // Try to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Reset failed attempts on successful login
      await updateDoc(userQuery, { failedAttempts: 0, lockUntil: null });

      // Redirect user based on their role
      alert("Sukses Login");
      if (userData.role === "user") {
        window.location.href = "../html/userPage.html";
      } else {
        window.location.href = "../html/adminPageEncrypt.html";
      }

    } else {
      alert("Email / Password Salah");
    }
  } catch (error) {
    const errorCode = error.code;

    if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
      // Handle failed login attempts
      const userQuery = doc(firestore, 'users', email);
      const userDoc = await getDoc(userQuery);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const failedAttempts = userData.failedAttempts || 0;
        let newLockUntil = null;

        // Check if the user has reached the limit of 3 failed attempts
        if (failedAttempts >= 2) {
          // Lock the account for 15 minutes
          newLockUntil = new Date();
          newLockUntil.setMinutes(newLockUntil.getMinutes() + 15);
          alert(`Too many failed login attempts. Your account is locked for 15 minutes.`);
        }

        // Update the failedAttempts count and lockUntil timestamp in Firestore
        await updateDoc(userQuery, {
          failedAttempts: failedAttempts + 1,
          lockUntil: newLockUntil ? newLockUntil : null
        });
      } else {
        // If the user does not exist, simply show an error
        alert('Email / Password is incorrect');
      }
    } else {
      console.error('Login error: ', error.message);
      alert('An error occurred during login');
    }
  }
});
