A Definitive Guide to Implementing Secure User Authentication with Firebase and Realtime DatabaseSection 1: Foundational Setup: Configuring Your Firebase EnvironmentThe initial configuration of the Firebase environment is the most critical phase of the integration process. A robust and secure foundation prevents systemic vulnerabilities and ensures that all subsequent features function as intended. This section provides a meticulous, step-by-step guide to creating the Firebase project, activating the necessary services with a security-first mindset, and correctly integrating the Firebase Software Development Kit (SDK) into a modern web application.1.1. Project Creation and Service ActivationThe first step involves setting up the project and its core services directly within the Firebase Console. This process establishes the backend infrastructure that the web application will communicate with.Step-by-Step Console Configuration:Create a Firebase Project: Navigate to the Firebase Console at https://console.firebase.google.com/ and create a new project by clicking "Add Project".1 Follow the guided prompts, which include providing a project name and optionally configuring Google Analytics.3Enable Authentication Provider: Once the project dashboard is visible, navigate to the Build section in the left-hand menu and select Authentication. Click "Get Started" to enter the Authentication dashboard. Select the "Sign-in method" tab and enable the Email/Password provider.2 This action is non-negotiable; without it, all attempts to create users via email and password will fail with an operation-not-allowed error.6Create Realtime Database Instance: Return to the Build section and select Realtime Database. Click "Create Database" and follow the prompts. During this setup, you will be asked to choose security rules. It is imperative to select Start in locked mode.7 This sets the default security rules to deny all read and write access (".read": false, ".write": false), effectively securing your database from unauthorized access from the very beginning.8 While a "test mode" option exists, it leaves the database publicly accessible for a limited time and should be avoided in any development workflow that aims for production readiness.81.2. Integrating the Firebase JS SDK (v9+ Modular) into Your Web AppWith the backend services enabled, the next step is to connect the frontend web application to Firebase using its JavaScript SDK. This report will focus exclusively on the modern Firebase v9+ modular SDK, which is the current industry standard due to its efficiency and tree-shakeable nature, resulting in smaller bundle sizes.10Step-by-Step SDK Integration:Register Your Web App: In the Firebase project's Project Overview page, click the web icon (</>) to register your application.1 Provide a nickname for your app and click "Register app." Firebase will then present a configuration object (firebaseConfig).3 This object is essential for initializing the SDK.Install the SDK: The recommended method for installing the Firebase SDK in a modern web development environment is via a package manager like npm. Execute the following command in your project's terminal 3:Bashnpm install firebase
Import Modular Functions: In your application's JavaScript files, you will import only the specific functions you need from the Firebase SDK. This modular approach is a key advantage of the v9+ API. For this guide, the essential imports are initializeApp from firebase/app, getAuth from firebase/auth, and getDatabase from firebase/database.11.3. The Firebase Configuration Object: Initialization and SecurityThe firebaseConfig object serves as the bridge between your client-side code and your specific Firebase project. Proper initialization is crucial for the application to function.Initialization Code:Create a dedicated file (e.g., firebase-config.js) to house the initialization logic. This promotes a clean and maintainable codebase.JavaScript// Import necessary functions from the Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration object
// TODO: Replace with your project's actual configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "https://YOUR_DATABASE_URL.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the Authentication service
export const auth = getAuth(app);

// Get a reference to the Realtime Database service
export const database = getDatabase(app);
This file initializes the Firebase application and exports the auth and database service handles, which will be used throughout your application to interact with Firebase.1A common point of concern for developers new to Backend-as-a-Service (BaaS) platforms is the placement of the firebaseConfig object, with its API keys, in client-side code.3 This appears to be a significant security risk. However, this reveals a fundamental architectural principle of Firebase: the security of the application does not depend on the secrecy of these client-side keys. These keys are merely identifiers; they tell the client application which Firebase project to communicate with. They are not authorizers and do not grant any inherent permissions.The true safeguard for your data is the robust system of server-side Firebase Security Rules.7 These rules are executed on Firebase servers and are the sole arbiter of data access, making them impossible for a malicious user to bypass, even if they have your firebaseConfig keys.7 Therefore, the developer's security focus must shift away from hiding client-side identifiers and towards authoring comprehensive and restrictive security rules. The client is considered untrusted by design; the server, through its rules, is the ultimate authority.Section 2: Implementing the Core Authentication LifecycleThis section details the implementation of the primary functions that govern a user's authentication journey: registration, login, and logout. The examples will utilize modern JavaScript async/await syntax for improved readability and error handling.2.1. User Registration: createUserWithEmailAndPasswordThe registration process involves creating a new user account within the Firebase Authentication service.Implementation:The createUserWithEmailAndPassword function takes the auth service handle, an email, and a password as arguments. It returns a promise that, upon successful resolution, provides a userCredential object containing information about the newly created user.1JavaScriptimport { auth } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "firebase/auth";

/**
 * Registers a new user with email and password.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's chosen password.
 * @returns {Promise<UserCredential>} A promise that resolves with the user credential object.
 */
export const registerUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User registered successfully:", userCredential.user);
    return userCredential;
  } catch (error) {
    console.error("Error during registration:", error);
    // Re-throw the error to be handled by the calling UI layer
    throw error;
  }
};
A critical behavior to understand is that a successful call to createUserWithEmailAndPassword not only creates the user but also automatically signs them into the application.5 This is a deliberate design choice by Firebase to streamline the user experience. However, it has profound implications for application state management. Developers who are unaware of this might attempt to manually call a sign-in function or trigger a redirect immediately after registration. This leads to redundant code and potential race conditions. The correct architectural pattern, which will be detailed in Section 5, is to rely on a centralized authentication state listener (onAuthStateChanged) to react to this automatic sign-in event. The registration function's sole responsibility should be to call the Firebase API; the listener's responsibility is to handle the resulting change in application state.2.2. User Login: signInWithEmailAndPasswordThe login process authenticates an existing user using their credentials.Implementation:The signInWithEmailAndPassword function operates similarly to its registration counterpart, accepting the auth handle, email, and password. On success, it resolves with the userCredential for the now-authenticated user.1JavaScriptimport { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from "firebase/auth";

/**
 * Signs in an existing user with email and password.
 * @param {string} email - The user's email address.
 * @param {string} password - The user's password.
 * @returns {Promise<UserCredential>} A promise that resolves with the user credential object.
 */
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("User signed in successfully:", userCredential.user);
    return userCredential;
  } catch (error) {
    console.error("Error during sign-in:", error);
    throw error;
  }
};
2.3. User Logout: signOutThe logout process invalidates the user's current session.Implementation:The signOut function is a straightforward call that takes the auth handle as its only argument. It invalidates the user's session token and triggers the global onAuthStateChanged listener, signaling that the user is now logged out.3JavaScriptimport { auth } from './firebase-config.js';
import { signOut } from "firebase/auth";

/**
 * Signs out the currently authenticated user.
 * @returns {Promise<void>} A promise that resolves when the sign-out is complete.
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully.");
  } catch (error) {
    console.error("Error during sign-out:", error);
    throw error;
  }
};
Section 3: Persisting and Managing User Data in Realtime DatabaseA core requirement of most applications is to store more information about a user than just their email and password. This section covers the best practices for structuring and managing user-specific data in the Firebase Realtime Database, ensuring it is securely linked to their authentication identity.3.1. Data Modeling: Structuring a users CollectionThe way data is structured in a NoSQL database like Firebase's Realtime Database directly impacts security, performance, and scalability. The canonical and most secure method for storing user profiles is to create a top-level node named users. Within this node, each user's data is stored in an object whose key is the user's unique ID (uid) provided by Firebase Authentication.15Recommended Data Structure:JSON{
  "users": {
    "UNIQUE_USER_ID_1": {
      "username": "jdoe",
      "fullName": "John Doe",
      "createdAt": 1678886400000
    },
    "UNIQUE_USER_ID_2": {
      "username": "asmith",
      "fullName": "Alice Smith",
      "createdAt": 1678886500000
    }
  }
}
This structure is not merely a convention; it is a prerequisite for implementing the most effective security rules, as will be demonstrated in Section 4. It allows for a direct and efficient way to grant a user access only to their own data record.173.2. The Register-and-Write Pattern: Handling User Profile CreationA crucial point to understand is that creating a user in Firebase Authentication and creating their corresponding record in the Realtime Database are two distinct, separate operations.18 There is no single, atomic client-side SDK function that performs both actions simultaneously. This introduces the possibility of an inconsistent state: an authentication user could be created, but a subsequent network failure could prevent their database record from being written, resulting in an "orphan" auth user.While this is an edge case, a robust application must handle it gracefully. The most reliable client-side pattern is to chain the operations using promises or async/await. The database write operation should only be attempted after the createUserWithEmailAndPassword call has successfully resolved.18Implementation:The following function demonstrates this reliable, sequential pattern.JavaScriptimport { auth, database } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";

/**
 * Registers a new user and creates their initial profile in the Realtime Database.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @param {object} additionalData - An object containing additional user data (e.g., { username, fullName }).
 * @returns {Promise<void>}
 */
export const registerAndCreateUserProfile = async (email, password, additionalData) => {
  try {
    // Step 1: Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step 2: Create the user profile in Realtime Database
    // Use the user's UID as the key
    await set(ref(database, 'users/' + user.uid), {
      email: user.email,
     ...additionalData,
      createdAt: new Date().toISOString() // Store creation timestamp
    });

    console.log("User registered and profile created successfully.");

  } catch (error) {
    console.error("Error during registration and profile creation:", error);
    throw error;
  }
};
For applications requiring absolute transactional integrity, the definitive solution is to use Firebase Cloud Functions. A server-side trigger, functions.auth.user().onCreate(), can listen for new user creation events and reliably create the corresponding database record.19 This moves the logic to the server, eliminating the client-side point of failure and guaranteeing atomicity. While a full implementation of Cloud Functions is beyond the scope of this guide, it represents the enterprise-grade best practice for this problem. For most applications, the client-side sequential pattern is sufficient.3.3. Writing and Updating User Profile DataOnce a user is authenticated and their profile exists, updating their information involves targeting their specific data record using their uid. The update method is generally preferred over set for modifications, as it only affects the specified fields without overwriting the entire object.Implementation:JavaScriptimport { database, auth } from './firebase-config.js';
import { ref, update } from "firebase/database";

/**
 * Updates the profile data for the currently signed-in user.
 * @param {object} dataToUpdate - An object with the fields to update (e.g., { fullName: "Jane Doe" }).
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (dataToUpdate) => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently signed in.");
  }

  try {
    const userProfileRef = ref(database, 'users/' + user.uid);
    await update(userProfileRef, dataToUpdate);
    console.log("User profile updated successfully.");
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};
Section 4: Fortifying Your Application: Security Rules and Data ValidationSecurity rules are the non-negotiable cornerstone of a secure Firebase application. They are the server-side logic that protects your data from unauthorized access, and they must be designed in tandem with your data structure.74.1. The Anatomy of Realtime Database Security RulesRealtime Database Security Rules are defined in a JSON-like structure and are hosted on Firebase servers.13 Every read and write request from a client is evaluated against these rules before any data access is granted.8Core Rule Types:.read: A boolean expression that determines if a user can read data at a specific path..write: A boolean expression that determines if a user can write data at a specific path..validate: A boolean expression that enforces data structure and format before a write is committed.Cascading Logic: .read and .write rules cascade downwards. If a rule grants access at a parent path, it implicitly grants the same access to all child paths unless a more specific rule at a child path overrides it.13.validate rules, however, do not cascade.8Default State: Rules are "deny-by-default." Access is denied unless a rule explicitly grants it.134.2. Securing User-Specific Data: The Content-Owner-Only PatternThe most fundamental security requirement for this application is to ensure that users can only access and modify their own data. The data structure defined in Section 3.1 (/users/{uid}) enables a remarkably simple and powerful rule to enforce this.This symbiotic relationship between data structure and security is a core concept in expert Firebase development. The elegance and security of the rule are a direct consequence of the decision to use the user's uid as the primary key for their data record.Canonical Security Rule for User Data:In the Realtime Database section of the Firebase Console, navigate to the "Rules" tab and replace the default rules with the following:JSON{
  "rules": {
    "users": {
      // The '$uid' is a wildcard that captures the key of the user record.
      "$uid": {
        // A user can read their own data if they are authenticated and their auth.uid matches the record's key.
        ".read": "auth!= null && auth.uid === $uid",
        // A user can write to their own data if they are authenticated and their auth.uid matches the record's key.
        ".write": "auth!= null && auth.uid === $uid"
      }
    }
  }
}
This rule set effectively isolates user data. The auth variable is a server-provided object containing the authentication details of the user making the request, and auth.uid is their unique ID. The $uid is a wildcard variable that represents the key of the database node being accessed. The rule simply checks if these two values are identical, thereby guaranteeing that only the owner of the data can interact with it.94.3. Implementing Data Validation with .validate RulesBeyond controlling access, security rules can enforce data integrity. The .validate rule ensures that any data being written to the database conforms to a predefined schema, preventing malformed or malicious data from being saved.13Example Validation Rules:Let's expand the previous rules to include validation for a username and createdAt field.JSON{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth!= null && auth.uid === $uid",
        ".write": "auth!= null && auth.uid === $uid",

        // Validation rules for the data being written (newData)
        ".validate": "newData.hasChildren(['email', 'username', 'createdAt'])",

        "username": {
          // Username must be a string between 3 and 30 characters.
          ".validate": "newData.isString() && newData.val().length >= 3 && newData.val().length <= 30"
        },
        "email": {
          // Email must be a string and look like an email address.
          ".validate": "newData.isString() && newData.val().matches(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,4}$/i)"
        },
        "createdAt": {
          // The createdAt field can only be written once (on creation).
          // It must be a string (we use ISOString).
          ".validate": "!data.exists() && newData.isString()"
        },
        // Disallow any other unknown properties from being written.
        "$other": {
          ".validate": false
        }
      }
    }
  }
}
These rules add a powerful layer of server-enforced data validation, ensuring consistency and robustness for your application's data model.8Section 5: Real-time Session Management: The onAuthStateChanged ObserverA modern web application must be reactive, updating its state and UI in real-time as the user's authentication status changes. The onAuthStateChanged observer is the Firebase-provided mechanism designed specifically for this purpose, acting as the central hub for all authentication-related state management.5.1. The Canonical Approach to Tracking Authentication StateThe onAuthStateChanged function registers a listener that fires whenever a user signs in, signs out, or when their session token is refreshed upon initial page load.20 The callback function receives a user object if someone is authenticated, or null if they are not.22This listener should be established as soon as the application loads, typically in the main entry point of your application's JavaScript.JavaScriptimport { auth } from './firebase-config.js';
import { onAuthStateChanged } from "firebase/auth";

/**
 * Sets up a listener for authentication state changes.
 * @param {function} callback - A function to be called with the user object (or null).
 * @returns {function} An unsubscribe function to detach the listener.
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
5.2. Managing UI and Protected Routes Based on User StateThe information provided by the onAuthStateChanged listener is the single source of truth for the user's session. This state should be used to drive all conditional UI rendering and route protection logic.For example, in your main application logic, you would use this listener to:Show or hide login/registration forms versus a user dashboard.Display the user's name or a "Logout" button.Prevent access to protected client-side routes if the user object is null.This centralized approach creates a highly decoupled and maintainable architecture. The signInUser and registerUser functions are simplified to only be responsible for calling the Firebase API. They do not need to handle UI updates or redirects. The onAuthStateChanged listener becomes the sole component responsible for reacting to the resulting state change, regardless of how it was triggered.23 This "Auth Hub" pattern is a hallmark of professional Firebase development, as it correctly handles all authentication events, including initial load, explicit sign-in/out, and even session revocation by an administrator.5.3. Listener Lifecycle and Memory ManagementThe onAuthStateChanged function returns an unsubscribe function.21 In single-page applications built with frameworks like React, Vue, or Angular, it is crucial to call this unsubscribe function when the component that created the listener is unmounted. Failure to do so results in a memory leak, as the listener will continue to run in the background even after the UI component is no longer visible.22Example with Component Lifecycle (React useEffect Hook):JavaScriptimport React, { useState, useEffect } from 'react';
import { onAuthStateChange } from './auth.js';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChange returns the unsubscribe function
    const unsubscribe = onAuthStateChange(user => {
      setCurrentUser(user);
      setLoading(false);
    });

    // The cleanup function returned by useEffect will be called on component unmount
    return () => {
      unsubscribe();
    };
  },); // The empty dependency array ensures this effect runs only once on mount

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {currentUser? (
        <h1>Welcome, {currentUser.email}</h1>
      ) : (
        <h1>Please Sign In</h1>
      )}
    </div>
  );
}
This pattern ensures that the listener is properly registered on component mount and cleaned up on unmount, preventing memory leaks and ensuring a well-behaved application.Section 6: Proactive Error Handling and User ExperienceA flawless implementation is incomplete without robust and user-friendly error handling. Simply logging errors to the console is insufficient for a production application. This section provides a comprehensive framework for catching, processing, and presenting authentication errors in a way that guides the user toward a solution.6.1. A Robust Framework for Catching and Processing ErrorsAll asynchronous Firebase Authentication functions can fail, and they will throw an error if they do. The modern async/await syntax, combined with try...catch blocks, provides a clean and effective way to manage these errors.24 The key to programmatic handling is to inspect the code property of the caught error object. This code is a stable string identifier for the specific error that occurred.5JavaScript// Example within a UI event handler
async function handleLoginAttempt(email, password) {
  try {
    await signInUser(email, password);
    // On success, the onAuthStateChanged listener will handle the redirect.
  } catch (error) {
    // The error object from Firebase contains a 'code' property.
    const userFriendlyMessage = getAuthErrorMessage(error.code);
    // Display this message to the user in the UI.
    alert(userFriendlyMessage);
  }
}
6.2. A Catalogue of Common Authentication ErrorsFirebase can return a wide variety of error codes. A common mistake is to display the raw, developer-focused error message to the end-user.27 The professional approach is to map these codes to clear, actionable messages. The following table provides a reference for the most common errors encountered during email/password authentication.Error CodeContextTechnical MeaningRecommended User-Facing MessageSuggested UX Actionauth/invalid-emailLogin/RegisterThe email address is not formatted correctly."Please enter a valid email address."Highlight the email input field with an error state.auth/user-not-foundLoginNo user record corresponds to the provided email."No account found with this email. Please check the email or sign up."Provide links to the registration page and password reset flow.auth/wrong-passwordLoginThe password is incorrect for the given email."Incorrect password. Please try again."Clear the password field and allow the user to re-enter.auth/invalid-credentialLoginGeneric error for invalid email or password."Invalid email or password. Please check your credentials."Clear the password field and allow the user to re-enter.auth/email-already-in-useRegisterThe email address is already registered."An account with this email address already exists."Display a message with a link to the 'Login' page. 28auth/weak-passwordRegisterThe password does not meet Firebase's minimum strength (at least 6 characters)."Password is too weak. It must be at least 6 characters long."Provide clear password strength requirements next to the input field. 29auth/too-many-requestsLogin/RegisterUnusual activity detected from the device or IP address."Access to this account has been temporarily disabled due to too many failed login attempts. You can immediately restore it by resetting your password or you can try again later."Temporarily disable the login/register button and suggest a password reset.auth/network-request-failedAnyA network connectivity error occurred."A network error occurred. Please check your internet connection and try again."Allow the user to retry the action.auth/requires-recent-loginSensitive OpsAn operation (e.g., password update) requires recent re-authentication."This action is sensitive and requires you to sign in again for security."Prompt the user with a re-authentication modal. 316.3. Translating Technical Errors into User-Friendly FeedbackTo implement the mapping strategy, a simple helper function can be created. This function centralizes all error message logic, making it easy to update or localize in the future.Error Mapping Function:JavaScript/**
 * Maps a Firebase Auth error code to a user-friendly message.
 * @param {string} errorCode - The 'code' property from the Firebase error object.
 * @returns {string} A user-friendly error message.
 */
export function getAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Your password is too weak. It must be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to too many failed attempts. Please try again later or reset your password.';
    case 'auth/network-request-failed':
      return 'A network error occurred. Please check your connection and try again.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}
Furthermore, a proactive approach to error handling can improve the user experience. For instance, client-side validation can check for password length before submitting the registration form, preventing the auth/weak-password error from ever being returned by Firebase.29 This provides instant feedback to the user and reduces unnecessary network requests.Section 7: Synthesis: A Complete Implementation BlueprintThis final section consolidates all the discussed principles and code into a cohesive, practical blueprint. It provides a complete set of files for a vanilla JavaScript implementation, demonstrating how to structure the code and integrate all the best practices into a working example.7.1. Full Code for a Vanilla JavaScript Authentication ModuleThis auth.js file encapsulates all Firebase interaction logic, creating a clean separation of concerns. The UI code will only need to interact with these exported functions.auth.js:JavaScriptimport { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- 1. INITIALIZATION ---
// TODO: Replace with your project's actual configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "https://YOUR_DATABASE_URL.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// --- 2. AUTHENTICATION FUNCTIONS ---

export const registerUser = async (email, password, username) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  // After creating the auth user, create their profile in the database
  await set(ref(database, 'users/' + user.uid), {
    username: username,
    email: user.email,
    createdAt: new Date().toISOString(),
  });
  return userCredential;
};

export const signInUser = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOutUser = () => {
  return signOut(auth);
};

// --- 3. AUTH STATE OBSERVER ---

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// --- 4. ERROR HANDLING ---

export function getAuthErrorMessage(errorCode) {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An unknown error occurred. Please try again.';
  }
}
7.2. Integrating the Module with HTML FormsThis demonstrates how to use the auth.js module in a practical setting with standard HTML forms.index.html:HTML<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Firebase Auth Demo</title>
</head>
<body>

    <div id="auth-forms">
        <h2>Register</h2>
        <form id="register-form">
            <input type="text" id="register-username" placeholder="Username" required>
            <input type="email" id="register-email" placeholder="Email" required>
            <input type="password" id="register-password" placeholder="Password" required>
            <button type="submit">Register</button>
        </form>

        <h2>Login</h2>
        <form id="login-form">
            <input type="email" id="login-email" placeholder="Email" required>
            <input type="password" id="login-password" placeholder="Password" required>
            <button type="submit">Login</button>
        </form>
        <p id="auth-error" style="color: red;"></p>
    </div>

    <div id="user-dashboard" style="display: none;">
        <h1>Welcome, <span id="user-email"></span>!</h1>
        <button id="logout-button">Logout</button>
    </div>

    <script type="module" src="main.js"></script>
</body>
</html>
main.js:JavaScriptimport {
  registerUser,
  signInUser,
  signOutUser,
  onAuthChange,
  getAuthErrorMessage
} from './auth.js';

// DOM Elements
const authFormsContainer = document.getElementById('auth-forms');
const userDashboard = document.getElementById('user-dashboard');
const userEmailSpan = document.getElementById('user-email');
const authErrorP = document.getElementById('auth-error');

const registerForm = document.getElementById('register-form');
const loginForm = document.getElementById('login-form');
const logoutButton = document.getElementById('logout-button');

// --- EVENT LISTENERS ---

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authErrorP.textContent = '';
  const username = document.getElementById('register-username').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;

  try {
    await registerUser(email, password, username);
    registerForm.reset();
  } catch (error) {
    authErrorP.textContent = getAuthErrorMessage(error.code);
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authErrorP.textContent = '';
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    await signInUser(email, password);
    loginForm.reset();
  } catch (error) {
    authErrorP.textContent = getAuthErrorMessage(error.code);
  }
});

logoutButton.addEventListener('click', async () => {
  try {
    await signOutUser();
  } catch (error) {
    console.error("Logout failed:", error);
    alert('Failed to log out.');
  }
});

// --- AUTH STATE OBSERVER ---

onAuthChange(user => {
  if (user) {
    // User is signed in
    authFormsContainer.style.display = 'none';
    userDashboard.style.display = 'block';
    userEmailSpan.textContent = user.email;
    authErrorP.textContent = '';
  } else {
    // User is signed out
    authFormsContainer.style.display = 'block';
    userDashboard.style.display = 'none';
    userEmailSpan.textContent = '';
  }
});
7.3. Final Review of Best PracticesThis report has detailed a comprehensive approach to integrating Firebase Authentication and Realtime Database. To conclude, the following checklist summarizes the key architectural and security best practices that form the foundation of a professional implementation:Secure from the Start: Always initialize your Realtime Database in Locked Mode. Security should be an initial design consideration, not an afterthought.7Embrace Modern Tooling: Utilize the v9+ Modular Firebase SDK to ensure an efficient, tree-shakeable application bundle.10Co-Design Data and Security: Structure your user data with the user's uid as the primary key. This enables simple, performant, and highly secure "content-owner-only" rules.7Centralize State Management: Use the onAuthStateChanged listener as the central "Auth Hub." It should be the single source of truth for authentication state, responsible for all UI updates and routing logic related to the user's session.22Implement the Reliable Register-and-Write Sequence: Since client-side atomicity is not available, reliably chain user creation in Auth with profile creation in the Database using promises or async/await.18Prioritize User Experience in Error Handling: Never display raw technical error codes to the user. Implement a mapping layer to translate error.code into clear, actionable, and user-friendly messages.27Manage Listener Lifecycles: In framework-based applications, always unsubscribe from the onAuthStateChanged listener during component cleanup to prevent memory leaks.21