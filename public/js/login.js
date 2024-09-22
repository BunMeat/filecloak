import { initializeApp as initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth as getAuth, signInWithEmailAndPassword as signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore as getFirestore, doc as doc, getDoc as getDoc, getDocs as getDocs, query as query, collection as collection, where as where, updateDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

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
    const userDoc = await getDoc(doc(firestore, 'users', email));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log("userData", userData);

      // Check if user has reached or exceeded attempt limit
      if (userData.attemptNo >= 3) {
        alert("Pengguna diblokir. Hubungi dukungan.");
        window.location.href = "../html/Login.html"; // Redirect to login page
        return;  // Stop execution if user is blocked
      }

      // Try to log in the user
      await signInWithEmailAndPassword(auth, email, password);

      // If login is successful, reset attemptNo to 0
      await updateDoc(doc(firestore, 'users', email), {
        attemptNo: 0
      });

      // Redirect based on user role
      if (userData.role === "user") {
        alert("Sukses Login");
        window.location.href = "../html/userPage.html";
      } else {
        alert("Sukses Login");
        window.location.href = "../html/adminPageEncrypt.html";
      }
    } else {
      alert("Akun tidak ditemukan.");
    }
  } catch (error) {
    console.log(error);

    // If login fails, increment the attemptNo
    const userDoc = await getDoc(doc(firestore, 'users', email));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Increment attemptNo and update Firestore
      await updateDoc(doc(firestore, 'users', email), {
        attemptNo: userData.attemptNo + 1
      });

      // Check if the user has reached 3 failed attempts and block the account
      if (userData.attemptNo >= 3) {
        alert("Pengguna diblokir. Hubungi dukungan.");
        window.location.href = "../html/Login.html";  // Redirect to login page after blocking
      } else {
        alert("Email atau password salah. Percobaan gagal.");
      }
    } else {
      alert("Akun tidak ditemukan.");
    }
  }
});