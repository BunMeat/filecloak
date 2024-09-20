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
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));

    if (userDoc.exists()) {
      const userData = userDoc.data();
      alert("Sukses Login");

      // Check if user is disabled
      if (userData.disabled) {
        alert("Your account is disabled. Please contact support.");
        return;
      }

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

    // Fetch user doc based on email and increment failed attempts
    const userQuery = doc(firestore, 'users', user.uid);
    const userDoc = await getDoc(userQuery);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const failedAttempts = userData.failedAttempts || 0;

      if (failedAttempts >= 2) {
        const response = await fetch('/disableUser', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email }), // or user.uid if you prefer
        });
  
        if (response.ok) {
          alert(`User has been disabled after ${failedAttempts + 1} failed attempts.`);
        } else {
          alert('Failed to disable user.');
        }
      }

      // Update failed attempts count in Firestore
      await updateDoc(userQuery, {
        failedAttempts: failedAttempts + 1
      });
    }
  }
});
