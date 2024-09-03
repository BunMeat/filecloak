import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  PhoneAuthProvider, 
  multiFactor, 
  getMultiFactorResolver, 
  RecaptchaVerifier 
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
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

// Ensure the reCAPTCHA container exists before initializing
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('recaptcha-container')) {
    const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible', // or 'normal' for visible reCAPTCHA
      'callback': (response) => {
        console.log('reCAPTCHA solved', response);
      }
    }, auth);

    // Render reCAPTCHA
    recaptchaVerifier.render().then((widgetId) => {
      window.recaptchaWidgetId = widgetId;
    });
  }
});

// Function to handle MFA enrollment
async function handleMFA(user) {
  alert('Please complete MFA verification.');
  
  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const phoneNumber = prompt('Enter your phone number for MFA verification:');

  try {
    // Trigger the reCAPTCHA challenge and send the verification code
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneNumber, window.recaptchaVerifier);

    const verificationCode = prompt('Enter the verification code sent to your phone:');
    const cred = PhoneAuthProvider.credential(verificationId, verificationCode);

    await multiFactor(user).enroll(cred);
    alert('MFA setup is complete!');
    await afterLogin(user);
  } catch (error) {
    console.error('MFA enrollment error:', error);
    alert('Failed to complete MFA setup. Please try again.');
  }
}

// Function to handle second-factor authentication
async function handleSecondFactor(resolver) {
  const phoneAuthProvider = new PhoneAuthProvider(auth);
  const phoneNumber = prompt('Enter your phone number for MFA verification:');
  
  try {
    // Trigger the reCAPTCHA challenge and send the verification code
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneNumber, window.recaptchaVerifier);

    const verificationCode = prompt('Enter the verification code sent to your phone:');
    const mfaAssertion = PhoneAuthProvider.credential(verificationId, verificationCode);

    // Resolve MFA sign-in
    const userCredential = await resolver.resolveSignIn(mfaAssertion);
    await afterLogin(userCredential.user);
  } catch (error) {
    console.error('Second-factor authentication error:', error);
    alert('Failed to complete second-factor authentication. Please try again.');
  }
}

// Function to handle errors
function handleError(error) {
  console.error('Login error: ', error.message);
  alert("Server error: " + error.message);
}

// Function to execute after successful login
async function afterLogin(user) {
  try {
    const userDoc = await getDoc(doc(firestore, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      alert("Successfully logged in");
      if (userData.role === "user") {
        window.location.href = "../html/userPage.html";
      } else {
        window.location.href = "../html/adminPageEncrypt.html";
      }
    } else {
      alert("Incorrect Email / Password");
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    alert('Error fetching user data. Please try again.');
  }
}

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