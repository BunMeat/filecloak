import { initializeApp as initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth as getAuth, signInWithEmailAndPassword as signInWithEmailAndPassword, PhoneAuthProvider as PhoneAuthProvider, multiFactor as multiFactor, getMultiFactorResolver as getMultiFactorResolver, RecaptchaVerifier as RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: window.env.FIREBASEKEY,
  authDomain: window.env.FIREBASEAUTHDOMAIN,
  projectId: window.env.PROJECTID,
  storageBucket: window.env.STORAGEBUCKET,
  messagingSenderId: window.env.MESSAGINGSENDERID,
  appId: window.env.APPID
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

// Initialize reCAPTCHA
const recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
  'size': 'invisible', // or 'normal' for visible reCAPTCHA
  'callback': (response) => {
    // Handle reCAPTCHA solved event
    console.log('reCAPTCHA solved', response);
  }
}, auth);

// Render reCAPTCHA
recaptchaVerifier.render().then((widgetId) => {
  window.recaptchaWidgetId = widgetId;
});

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('emailLogin').value;
  const password = document.getElementById('passwordLogin').value;

  try {
    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if the user has multi-factor authentication enabled
    if (multiFactor(user).enrolledFactors.length > 0) {
      // MFA is enabled, handle the second-factor authentication
      await handleMFA(user);
    } else {
      // MFA is not enabled, proceed with the normal login flow
      await afterLogin(user);
    }
  } catch (error) {
    if (error.code === 'auth/multi-factor-auth-required') {
      // MFA is required, resolve it
      const resolver = getMultiFactorResolver(auth, error);
      await handleSecondFactor(resolver);
    } else {
      handleError(error);
    }
  }
});

// Function to handle MFA if it's enabled
async function handleMFA(user) {
  // This function should prompt the user to complete the second factor (e.g., SMS verification).
  console.log("MFA is enabled. Handling second-factor authentication...");
  // Add your MFA handling code here
}

// Function to handle after login process
async function afterLogin(user) {
  const userDoc = await getDoc(doc(firestore, 'users', user.uid));
  if (userDoc.exists()) {
    const userData = userDoc.data();
    alert("Login Successful");
    if (userData.role === "user") {
      window.location.href = "../html/userPage.html";
    } else {
      window.location.href = "../html/adminPageEncrypt.html";
    }
  } else {
    alert("Incorrect Email / Password");
  }
}

// Function to handle MFA second factor
async function handleSecondFactor(resolver) {
  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const phoneNumber = prompt('Enter your phone number for MFA verification:');
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneNumber, window.recaptchaVerifier);

  const verificationCode = prompt('Enter the verification code sent to your phone:');
  const cred = PhoneAuthProvider.credential(verificationId, verificationCode);

  const mfaAssertion = PhoneAuthProvider.credential(verificationId, verificationCode);
  const userCredential = await resolver.resolveSignIn(mfaAssertion);
  
  // Proceed after MFA is resolved
  await afterLogin(userCredential.user);
}

// Function to handle errors
function handleError(error) {
  const errorCode = error.code;
  const errorMsg = error.message;
  console.error('Login error: ', errorMsg);
  if (errorCode === 'auth/invalid-credential') {
    alert("Email / Password Salah");
  } else {
    console.error("errorMsg", errorMsg);
    console.error("errorCode", errorCode);
    alert("Kesalahan Server: " + errorMsg);
  }
}
