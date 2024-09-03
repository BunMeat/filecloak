import { initializeApp as initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth as getAuth, createUserWithEmailAndPassword as createUserWithEmailAndPassword, PhoneAuthProvider as PhoneAuthProvider, multiFactor as multiFactor, RecaptchaVerifier as RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
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

// Ensure the reCAPTCHA container exists before initializing
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('recaptcha-container')) {
    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible', // or 'normal' for visible reCAPTCHA
      'callback': (response) => {
        console.log('reCAPTCHA solved', response);
      }
    });

    // Render reCAPTCHA
    recaptchaVerifier.render().then((widgetId) => {
      window.recaptchaWidgetId = widgetId;
    });
  }
});

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

      // Set up reCAPTCHA verifier for phone authentication
      const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {});
      recaptchaVerifier.render();

      // Prompt the user to enroll in MFA with a phone number
      const phoneNumber = prompt("Please enter your phone number for MFA enrollment:");
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(phoneNumber, recaptchaVerifier);
      
      const verificationCode = prompt("Please enter the verification code sent to your phone:");
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);

      // Enroll the user in MFA with the phone credential
      await multiFactor(user).enroll(credential, 'Phone number');

      // Save user data to Firestore
      const userCollection = collection(firestore, "users");
      const userId = user.uid;
      const userRefDoc = doc(userCollection, userId);
      const userData = {
        uid: user.uid,
        role: "user",
        email: email
      };
      await setDoc(userRefDoc, userData);

      alert("Pendaftaran User Berhasil dengan MFA, Silahkan Login");
      console.log('User registered and data saved to Firestore:', user);
    }
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    if (errorCode === 'auth/email-already-in-use') {
      alert("Email Sudah Terdaftar");
    } else {
      alert("Kesalahan Server: " + errorMessage);
    }
    console.error('Registration error:', errorMessage);
  }
});
