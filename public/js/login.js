import { initializeApp as initializeApp} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth as getAuth, signInWithEmailAndPassword as signInWithEmailAndPassword, PhoneAuthProvider as PhoneAuthProvider, multiFactor as multiFactor, getMultiFactorResolver as getMultiFactorResolver, RecaptchaVerifier as RecaptchaVerifier } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore as getFirestore, doc as doc, getDoc as getDoc} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

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

const loginForm = document.getElementById('loginForm');

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

// Function to handle MFA enrollment
async function handleMFA(user) {
  // Display a prompt for the user to enroll in MFA or continue with MFA
  alert('Please complete MFA verification.');

  // Enroll in or verify MFA here
  // This example assumes the use of phone-based MFA

  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const phoneNumber = prompt('Enter your phone number for MFA verification:');
  const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneNumber, window.recaptchaVerifier);

  const verificationCode = prompt('Enter the verification code sent to your phone:');
  const cred = PhoneAuthProvider.credential(verificationId, verificationCode);

  await multiFactor(user).enroll(cred);
  alert('MFA setup is complete!');
  await afterLogin(user);
}

// Function to handle second-factor authentication
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

// Function to execute after successful login
async function afterLogin(user) {
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

// Setup reCAPTCHA for phone authentication (important step)
window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
  'size': 'invisible',
  'callback': function (response) {
    console.log('reCAPTCHA resolved');
  }
});

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
      handleMFA(user);
    } else {
      // MFA is not enabled, proceed with the normal login flow
      await afterLogin(user);
    }
    
  } catch (error) {
    if (error.code === 'auth/multi-factor-auth-required') {
      // MFA is required, resolve it
      const resolver = getMultiFactorResolver(auth, error);
      handleSecondFactor(resolver);
    } else {
      handleError(error);
    }
  }
});