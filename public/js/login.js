import { initializeApp as initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth as getAuth, signInWithEmailAndPassword as signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore as getFirestore, doc as doc, getDoc as getDoc, setDoc as setDoc, updateDoc as updateDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

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

    // If the user exists in Firestore
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentTime = new Date();

      // Check if account is locked
      if (userData.lockUntil && userData.lockUntil.toDate() > currentTime) {
        const remainingTime = Math.ceil((userData.lockUntil.toDate() - currentTime) / 1000 / 60);
        alert(`Your account is locked. Please try again after ${remainingTime} minutes.`);
        return;
      }

      // Try to sign in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Reset failed attempts on successful login
      await updateDoc(userQuery, { failedAttempts: 0, lockUntil: null });

      // Check the user's role and redirect accordingly
      if (userData.role === 'user') {
        window.location.href = '../html/userPage.html';
      } else {
        window.location.href = '../html/adminPageEncrypt.html';
      }
    } else {
      // If the user document doesn't exist
      alert('Email / Password is incorrect');
    }
  } catch (error) {
    // Failed login
    const errorCode = error.code;

    // Handle error cases
    if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
      const userQuery = doc(firestore, 'users', email);
      const userDoc = await getDoc(userQuery);

      // If the user document exists, increment failed attempts
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const failedAttempts = userData.failedAttempts || 0;
        const lockUntil = userData.lockUntil ? userData.lockUntil.toDate() : null;
        let newLockUntil = null;

        // If this is the third failed attempt, lock the account for 15 minutes
        if (failedAttempts >= 2) {
          const lockDuration = (failedAttempts + 1 - 2) * 15; // Gradual lock increase by 15 mins
          newLockUntil = new Date();
          newLockUntil.setMinutes(newLockUntil.getMinutes() + lockDuration);
          alert(`Too many failed login attempts. Your account is locked for ${lockDuration} minutes.`);
        }

        // Update failedAttempts and lockUntil
        await updateDoc(userQuery, {
          failedAttempts: failedAttempts + 1,
          lockUntil: newLockUntil ? newLockUntil : null
        });
      } else {
        alert('Email / Password is incorrect');
      }
    } else {
      console.error('Login error: ', error.message);
      alert('Server error occurred');
    }
  }
});
