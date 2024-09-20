import { initializeApp as initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth as getAuth, signInWithEmailAndPassword as signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore as getFirestore, doc as doc, getDoc as getDoc, updateDoc as updateDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

// Firebase config
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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user's Firestore document
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Check if account is locked
      if (userData.accountLocked) {
        alert("Your account has been locked due to too many failed login attempts.");
        return;
      }

      // Successful login
      alert("Sukses Login");

      // Reset failed attempts after successful login
      await updateDoc(doc(firestore, 'users', user.uid), { failedAttempts: 0 });

      // Redirect based on role
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
    const errorMsg = error.message;

    if (errorCode == "auth/too-many-requests") {
      alert(errorMsg);
    }

    console.error('Login error: ', errorMsg);

    // Handle invalid credentials and increment failed attempts
    if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found') {
      // Get the user document by email to track failed attempts
      const userDocRef = doc(firestore, 'users', email); // Adjust if email is mapped to the user document

      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const failedAttempts = userDoc.data().failedAttempts || 0;

        // Lock account after 3 failed attempts
        if (failedAttempts >= 2) {
          await updateDoc(userDocRef, { accountLocked: true });
          
          // Call backend to disable the account
          disableUserAccount(email);
          
          alert("Account has been locked after 3 failed attempts.");
        } else {
          // Increment failed attempts
          await updateDoc(userDocRef, { failedAttempts: failedAttempts + 1 });
          alert("Wrong email or password. Failed attempts: " + (failedAttempts + 1));
        }
      } else {
        alert("Pengguna tidak ada.");
      }
    }
  }
});

// Function to call backend API for disabling the user account
async function disableUserAccount(email) {
  try {
    await fetch('/disableUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email })
    });
    console.log('User account disabled.');
  } catch (error) {
    console.error('Error disabling user account: ', error);
  }
}
