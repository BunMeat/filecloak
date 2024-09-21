import { initializeApp as initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth as getAuth, signInWithEmailAndPassword as signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore as getFirestore, doc as doc, getDoc as getDoc, collection, query, where, getDocs, updateDoc  } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

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
    //check if user is blocked
    if (user.isBlocked === "blocked"){
      console.log("1");
      return error;
    }
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (user.isBlocked === "blocked"){
        console.log("1");
        return error;
      } else {
        console.log("2");
        if (userData.role === "user") {
          alert("Sukses Login");
          window.location.href = "../html/userPage.html";
        } else {
          alert("Sukses Login");
          window.location.href = "../html/adminPageEncrypt.html";
        }
      }
    } else {
      alert("Email / Password Salah");
    }
  } catch (error) {
    const errorCode = error.code;
    const errorMsg = error.message;
    console.error('Login error: ', errorMsg);

    if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password') {
      console.log("3");

      try {
        // Query the users collection by email
        const userCollection = collection(firestore, "users");
        const q = query(userCollection, where("email", "==", email));  // Replace 'email' with the field in Firestore where you store the email
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          // Get the first matching document (since email should be unique)
          const userDoc = querySnapshot.docs[0];
          const userId = userDoc.id; // The user ID (document ID) in Firestore

          // Now update the isBlocked field in the user document
          const userRefDoc = doc(userCollection, userId);
          await updateDoc(userRefDoc, {
            isBlocked: "blocked"  // Update the isBlocked field
          });

          console.log('User blocked successfully.');
        } else {
          console.log('No user found with the provided email.');
        }

      } catch (err) {
        console.error('Error querying user or updating document: ', err);
      }
  
    } else {
      console.log("errorMsg", errorMsg);
      console.log("errorCode", errorCode);
      alert("Kesalahan Server", errorMsg);
    }
  }
});
