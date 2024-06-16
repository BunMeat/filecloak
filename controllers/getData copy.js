import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

function getDataFile() {
    return new Promise((resolve, reject) => {
        const firebaseConfig = {
            apiKey: "AIzaSyB20-FKaNh-WQMKzdeDQGw4vggTurEdrUc",
            authDomain: "filecloak.firebaseapp.com",
            projectId: "filecloak",
            storageBucket: "filecloak.appspot.com",
            messagingSenderId: "370477539338",
            appId: "1:370477539338:web:5ad4ca5fbeddd2ce8cbff3"
        };
        
        const firebaseApp = initializeApp(firebaseConfig);
        const firestore = getFirestore(firebaseApp);
        
        const collectionRef = collection(firestore, "fileDoc");
        
        getDocs(collectionRef)
            .then((querySnapshot) => {
                const data = [];
                querySnapshot.forEach((doc) => {
                    // Push each document's data to the array
                    data.push(doc.data());
                });
                resolve(data);
            })
            .catch((error) => {
                reject(error);
            });
    });
}

export { getDataFile };
