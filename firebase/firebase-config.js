import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";


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

const registrationForm = document.getElementById("registerForm");

registrationForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth,email,password);
    const user = userCredential.user;

  } catch (error) {
    const errorCode = error.code;
    const errorMsg = error.message;
    console.error("Register Error", errorMsg);
  }
})



