import { initializeApp as initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth as getAuth, signInWithEmailAndPassword as signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore as getFirestore, doc as doc, getDoc as getDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

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

  const email  = document.getElementById('emailLogin').value;
  const password  = document.getElementById('passwordLogin').value;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
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
    const errorMsg = error.message;
    console.error('Login error: ', errorMsg);
    if (errorCode === 'auth/invalid-credential') {
      alert("Email / Password Salah");
    } else {
      console.log("errorMsg", errorMsg);
      console.log("errorCode", errorCode);
      alert("Kesalahan Server", errorMsg);
    }
  }
});
