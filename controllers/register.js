import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore, collection, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyB20-FKaNh-WQMKzdeDQGw4vggTurEdrUc",
  authDomain: "filecloak.firebaseapp.com",
  projectId: "filecloak",
  storageBucket: "filecloak.appspot.com",
  messagingSenderId: "370477539338",
  appId: "1:370477539338:web:5ad4ca5fbeddd2ce8cbff3"
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
      console.log('User registered:', user);

      const userCollection = collection(firestore, "users");
      const userId = user.uid;
      const userRefDoc = doc(userCollection, userId);
      const userData = {
        uid: user.uid,
        role: "user",
        email: email
      };
      await setDoc(userRefDoc, userData);
      alert("Pendaftaran User Berhasil, Silahkan Login");
      console.log('User registered and data saved to Firestore:', user);
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
