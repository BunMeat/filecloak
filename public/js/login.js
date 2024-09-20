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
    // Try to sign in
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;  // Get the signed-in user
    const userQuery = doc(firestore, 'users', user.uid); // Using uid as document ID

    console.log("1");

    const userDoc = await getDoc(userQuery);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentTime = new Date();

      // Check if the account is locked
      if (userData.lockUntil && userData.lockUntil.toDate() > currentTime) {
        const remainingTime = Math.ceil((userData.lockUntil.toDate() - currentTime) / 1000 / 60); // Calculate remaining lock time in minutes
        alert(`Akun diblokir, silahkan coba dalam ${remainingTime} menit.`);
        console.log("2");
        return;
      }

      // If successful, reset failed attempts and lockUntil
      await updateDoc(userQuery, { failedAttempts: 0, lockUntil: null });

      // Redirect the user based on their role
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

    console.log("3");

    if (errorCode === 'auth/too-many-requests'){
      console.log("7");
      alert("Akun terblokir. Silahkan mencoba beberapa menit lagi.");
    }

    if (errorCode === 'auth/wrong-password' || errorCode === 'auth/user-not-found' || errorCode === 'auth/invalid-credential') {
      // Fetch the Firestore document based on email to get the user UID
      console.log("3");
      const usersCollection = firestore.collection('users');
      const userQuerySnapshot = await usersCollection.where('email', '==', email).get();
    
      // If the document exists, get the user UID and use it to query Firestore
      if (!userQuerySnapshot.empty) {
        console.log("4");
        const userDoc = userQuerySnapshot.docs[0]; // Assuming email is unique
        const userData = userDoc.data();
        const userUid = userDoc.id;  // Get the document ID, which should be the UID
        const failedAttempts = userData.failedAttempts || 0;
        let newLockUntil = null;
    
        // Check if the user has reached the limit of 3 failed attempts
        if (failedAttempts >= 2) {
          console.log("5");
          // Lock the account for 15 minutes
          newLockUntil = new Date();
          newLockUntil.setMinutes(newLockUntil.getMinutes() + 15);
          alert(`Akun diblokir selama 15 menit karena terlalu banyak permintaan login.`);
        }
    
        // Update the failedAttempts count and lockUntil timestamp in Firestore
        await updateDoc(doc(firestore, 'users', userUid), {
          failedAttempts: failedAttempts + 1,
          lockUntil: newLockUntil ? newLockUntil : null
        });
    } else {
        // If the user does not exist, simply show an error
        console.log("6");
        alert('Pengguna tidak ada.');
      }

    }
  }
});
