import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js';
import { getFirestore, doc , getDoc} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js'

const firebaseConfig = {
    apiKey: process.env.FIREBASEKEY,
    authDomain: process.env.FIREBASEAUTHDOMAIN,
    projectId: process.env.PROJECTID,
    storageBucket: process.env.STORAGEBUCKET,
    messagingSenderId: process.env.MESSAGINGSENDERID,
    appId: process.env.APPID
  };

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);



const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email  = document.getElementById('emailLogin').value;
    const password  = document.getElementById('passwordLogin').value;
    try{
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if(userDoc.exists()){
            const userData = userDoc.data();
            alert("Sukses Login");
            if(userData.role == "user"){
                window.location.href="../public/userPage.html";
            } else {
                window.location.href="../public/adminPageEncrypt.html";
            }
         } else {
            alert("Email / Password Salah");
        }
    } catch(error){
        const errorCode = error.code;
        const errorMsg = error.message;
        console.error('Login error : ', errorMsg);
        if(errorCode === 'auth/invalid-credential'){
            alert("Email / Password Salah");
        } else {
            console.log("errorMsg", errorMsg);
            console.log("errorCode", errorCode);
            alert("Kesalahan Server", errorMsg);
        }

    }
});