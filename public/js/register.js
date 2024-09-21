import { initializeApp as initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth as getAuth, createUserWithEmailAndPassword as createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore as getFirestore, collection as collection, doc as doc, setDoc as setDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

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

// Registration Function
const registrationForm = document.getElementById('registerForm');

registrationForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const repeatPassword = document.getElementById('repeatPassword').value;

  try {
    if (repeatPassword !== password) {
      alert("Password tidak sama");
      return;
    } else {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      ('User registered:', user);

      const userCollection = collection(firestore, "users");
      const userId = user.uid;
      const userRefDoc = doc(userCollection, userId);
      const userData = {
        uid: user.uid,
        role: "user",
        email: email,
        isBlocked: "unblocked"
      };
      await setDoc(userRefDoc, userData);
      alert("Pendaftaran User Berhasil, Silahkan Login");
      ('User registered and data saved to Firestore:', user);
    }
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    if (errorCode === 'auth/email-already-in-use') {
      alert("Email Sudah Terdaftar");
    } else {
      alert("Kesalahan Server", errorMessage);
    }
    console.error('Registration error:', errorMessage);
  }
});
