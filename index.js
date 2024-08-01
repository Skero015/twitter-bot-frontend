import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/9.1.1/firebase-functions.js";
//require('dotenv').config();
import firebaseConfig from './config.js';

// Firebase configuration
// const firebaseConfig = {
//   apiKey: process.env.apiKey,
//   authDomain: process.env.authDomain,
//   projectId: process.env.projectId,
//   storageBucket: process.env.storageBucket,
//   messagingSenderId: process.env.messagingSenderId,
//   appId: process.env.appId,
//   measurementId: process.env.measurementId
// };


// Initialize Firebase app
const app = initializeApp(firebaseConfig);
// Get Firebase Functions instance
const functions = getFunctions(app);

// Database reference
//const dbRef = admin.firestore().doc(process.env.dbTokensRef);

// Reference to the Firebase Cloud Functions
const authFunction = httpsCallable(functions, 'auth');
const callbackFunction = httpsCallable(functions, 'callback');
const tweetFunction = httpsCallable(functions, 'tweet');
const triggerScheduledTweetFunction = httpsCallable(functions, 'triggerScheduledTweet');
const updateScheduleFunction = httpsCallable(functions, 'updateSchedule');
const generateAITweetFunction = httpsCallable(functions, 'generateAITweet');

//Generated Tweet variable
var tweet;


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

  const data = {state: state, code: code };

  callbackFunction(data)
    .then(result => {
      console.log('Callback success:', result.data);
    })
    .catch(error => {
      console.error('Error handling Twitter callback:', error);
    });
}

// Function to call 'tweet' or 'scheduledTweet' Firebase Cloud Function according to schedule type
function callTweetFunction(schedule, tweet) {

  if(schedule !== 'once'){
    //run tweet generation scheduled function
    triggerScheduledTweetFunction({})
    .then(result => {
      console.log('Scheduled Tweet function success:', result.data);
      // Handle the response or perform further actions
    })
    .catch(error => {
      console.error('Error calling tweet scheduling function:', error);
    });
  }else{
    //run regular tweet function
    tweetFunction({tweet: tweet})
    .then(result => {
      console.log('Tweet function success:', result.data);
      // Handle the response or perform further actions
    })
    .catch(error => {
      console.error('Error calling tweet function:', error);
    });
  }
  
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

// Event listener for OpenAI generate tweet button
document.getElementById('generate-button').addEventListener('click', async function() {
  const prompt = document.getElementById('prompt').value;
  const schedule = document.getElementById('schedule').value;
  const tweetTextElement = document.getElementById('tweet-text');
  const sendButton = document.getElementById('send-button');

  if (prompt && schedule) {
      try {
        //Generate 3 tweets if schedule is not 'once'
          const result = await generateAITweetFunction({ prompt: prompt, numberOfTweets: (schedule === 'once') ? 1 : 3});
          console.log('AI Tweet Generation function success:', result.data);
          
          // Clear previous tweets
          tweetTextElement.innerHTML = '';

          // Create and append p tags for each generated tweet
          result.data.tweets.forEach(tweet => { // Assuming result.data.tweets is an array of tweets
              const p = document.createElement('p');
              p.textContent = tweet;
              tweetTextElement.appendChild(p);
          });

          // Show the send button after tweet generation
          sendButton.style.display = 'block';
          sendButton.textContent = (result.data.tweets.length > 1) ? `Send Tweets` : 'Send Tweet';
      } catch (error) {
          console.error('Error calling tweet function:', error);
          tweetTextElement.textContent = 'Error generating tweet. Please try again.';
      }
  } else {
      alert('Please fill in all fields');
  }
});

// Event listener for the send tweet button
document.getElementById('send-button').addEventListener('click', function() {
  const schedule = document.getElementById('schedule').value;
  const tweetTextElement = document.getElementById('tweet-text');
  const firstTweet = tweetTextElement.firstChild?.textContent?.trim(); // Get the first tweet element

  //if tweet element exists and tweet has been generate
  if (firstTweet && firstTweet.length > 0) {
    callTweetFunction(schedule,firstTweet);
  } else {
    alert('Please ensure your tweet has been generated first');
  }
});
