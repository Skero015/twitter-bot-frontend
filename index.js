// Import Firebase SDK
//import firebase from 'firebase/app';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-app.js";
//import 'firebase/auth'; 
//import 'firebase/functions';
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-functions.js";
//import express from './node_modules/express/lib/express.js'; 
//const exp = express();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  // Add other parameters as needed
};


// Initialize Firebase app
const app = initializeApp(firebaseConfig);
// Get Firebase Functions instance
const functions = getFunctions(app);

  // Reference to the Firebase Cloud Functions
  const authFunction = httpsCallable(functions, 'auth');
  const callbackFunction = httpsCallable(functions, 'callback');
  const tweetFunction = httpsCallable(functions, 'tweet');
  const scheduledTweetFunction = httpsCallable(functions, 'scheduledTweet');
  const updateScheduleFunction = httpsCallable(functions, 'updateSchedule');


  // Function to initiate Twitter login
  function initiateTwitterLogin() {
    console.log('Initiating');
    authFunction({})
      .then(result => {
        const authUrl = result.data.url; // Get the authentication URL
        console.log(authUrl);
        // Redirect the user to the Twitter authentication URL
        window.location.href = authUrl;
      })
      .catch(error => {
        console.error('Error initiating Twitter login:', error);
      });
  }
  
  // Function to handle callback after Twitter authentication
  function handleTwitterCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get('state');
    const code = urlParams.get('code');
    console.log(state);
    console.log(code);
    
    const data = {state: state, code: code };

    callbackFunction(data)
      .then(result => {
        console.log('Callback success:', result.data);
        // Now that user is authenticated, call the 'tweet' Firebase Cloud Function
        callTweetFunction();
      })
      .catch(error => {
        console.error('Error handling Twitter callback:', error);
      });
  }
  
  // Function to call 'tweet' Firebase Cloud Function
  function callTweetFunction() {
    tweetFunction({})
      .then(result => {
        console.log('Tweet function success:', result.data);
        // Handle the response or perform further actions
      })
      .catch(error => {
        console.error('Error calling tweet function:', error);
      });
  }
  
  // Handle the Twitter callback from the child window
window.addEventListener('message', function(event) {
    console.log('listening...');
    if (event.origin === window.location.origin) {

      // Check if the message contains the expected parameters
      const { state, code } = event.data;

      if (state && code) {
        // Handle the received state and code
        console.log('Received state:', state);
        console.log('Received code:', code);
        // Perform necessary actions with 'state' and 'code'
        console.log('Parameters found. Handling Twitter callback...');
        //handleTwitterCallback(state,code);
      }
    }
  });
  
    // Check if the current URL contains parameters after redirection
    if (window.location.search.includes('state') && window.location.search.includes('code')) {
        
        // If parameters are found, log a message and handle the Twitter callback
        console.log('Parameters found. Handling Twitter callback...');
        handleTwitterCallback();
    } else {
        // Log a message if parameters are not found
        console.log('No parameters found in the URL.');
    }
  
  // Attach click event to initiate Twitter login when the button is clicked
  document.getElementById('login-button').addEventListener('click', initiateTwitterLogin);
