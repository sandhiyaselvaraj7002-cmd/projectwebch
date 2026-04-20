// ===================== 🔥 FIREBASE IMPORTS =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    doc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

// ===================== 🔥 FIREBASE CONFIG =====================
const firebaseConfig = {
    apiKey: "AIzaSyDwh8I7Q-rznqld_yKTI8NZoKNCYNQFJFw",
    authDomain: "usspace-81fc6.firebaseapp.com",
    projectId: "usspace-81fc6",
    storageBucket: "usspace-81fc6.firebasestorage.app",
    messagingSenderId: "759765363721",
    appId: "1:759765363721:web:a894ba10e2878aba8d9cd8",
    measurementId: "G-53ZX9KXDYS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===================== 💬 CORE MESSAGING =====================

async function sendMessage(textOverride = null) {
    const input = document.getElementById("message");
    const msgText = textOverride || (input ? input.value.trim() : null);
    
    if (!msgText) return;

    const currentSender = localStorage.getItem("chatName") || "User";

    try {
        await addDoc(collection(db, "messages"), {
            text: msgText,
            time: Date.now(),
            sender: currentSender
        });
        
        if (input && !textOverride) input.value = "";
    } catch (err) {
        console.error("Firebase Send Error:", err);
    }
}

// ===================== 🗑️ DELETE FUNCTION =====================

async function deleteMessage(msgId, senderName) {
    const myName = localStorage.getItem("chatName") || "User";

    console.log("Attempting to delete:", msgId, "Sent by:", senderName, "Action by:", myName);

    // Permission check
    if (senderName !== myName) {
        alert(`Wait! You are logged in as "${myName}", but this message was sent by "${senderName}". You can't delete it! ✋`);
        return;
    }

    const confirmDelete = confirm("Are you sure you want to delete this message?");
    if (confirmDelete) {
        try {
            // Create a reference to the specific document
            const messageRef = doc(db, "messages", msgId);
            await deleteDoc(messageRef);
            console.log("Document successfully deleted!");
        } catch (error) {
            console.error("Error removing document: ", error);
            alert("Delete failed. Check your Firebase Rules.");
        }
    }
}

function loadMessages() {
    const chatBox = document.getElementById("chatBox");
    if (!chatBox) return;

    const q = query(collection(db, "messages"), orderBy("time"));

    onSnapshot(q, (snapshot) => {
        chatBox.innerHTML = "";
        const myName = localStorage.getItem("chatName") || "User";

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const msgId = docSnap.id; 
            const isMe = data.sender === myName;

            const div = document.createElement("div");
            div.className = `message ${isMe ? "my-msg" : "other-msg"}`;
            
            // Critical: Make sure the function is called correctly
            div.setAttribute("onclick", `deleteMessage('${msgId}', '${data.sender.replace(/'/g, "\\'")}')`);
            div.style.cursor = "pointer";

            div.innerHTML = `
                <small style="font-size: 0.7em; font-weight: bold;">${data.sender}</small><br>
                ${data.text}<br>
                <small style="font-size: 0.6em; opacity: 0.7;">${new Date(data.time).toLocaleTimeString()}</small>
            `;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// ===================== 👤 PROFILE & UI =====================

function changeName() {
    const name = prompt("Enter your display name (Must match exactly to delete your messages):");
    if (name) {
        localStorage.setItem("chatName", name);
        location.reload();
    }
}

// ===================== 🌍 EXPOSE TO GLOBAL WINDOW =====================
// This is required so that HTML onclick events can "see" these functions
window.sendMessage = () => sendMessage();
window.deleteMessage = (id, sender) => deleteMessage(id, sender); 
window.changeName = changeName;
window.missYou = () => sendMessage("Missing you ❤️");
window.quickMissYou = () => sendMessage("Missing you ❤️");
window.openChat = () => location.href = "chat.html";
window.goHome = () => location.href = "home.html";
window.openNotes = () => location.href = "notes.html";
window.goChat = () => location.href = "chat.html";

window.onload = () => {
    loadMessages();
    const nameEl = document.getElementById("chatName") || document.getElementById("homeName");
    if (nameEl) {
        nameEl.innerText = localStorage.getItem("chatName") || "My Person 💜";
    }
};
// ===================== 🗑️ CLEAR ALL MESSAGES =====================
async function clearChat() {
    if (confirm("Are you sure you want to delete ALL messages? This cannot be undone! 🚨")) {
        try {
            const { getDocs } = await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js");
            const querySnapshot = await getDocs(collection(db, "messages"));
            
            const deletePromises = [];
            querySnapshot.forEach((docSnap) => {
                deletePromises.push(deleteDoc(doc(db, "messages", docSnap.id)));
            });

            await Promise.all(deletePromises);
            console.log("All messages deleted!");
        } catch (err) {
            console.error("Clear Chat Error:", err);
            alert("Failed to clear chat. Check your permissions.");
        }
    }
}

// Ensure it is exposed to the HTML
window.clearChat = clearChat;

// ===================== 📝 NOTES LOGIC =====================

async function addNote() {
    const text = prompt("Enter your note:");
    if (!text) return;

    try {
        await addDoc(collection(db, "notes"), {
            content: text,
            time: Date.now(),
            author: localStorage.getItem("chatName") || "User"
        });
    } catch (err) {
        console.error("Error adding note:", err);
    }
}

function loadNotes() {
    const notesList = document.getElementById("notesList");
    const previewList = document.getElementById("notesPreviewList");
    if (!notesList && !previewList) return;

    const q = query(collection(db, "notes"), orderBy("time", "desc"));

    onSnapshot(q, (snapshot) => {
        let html = "";
        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            html += `
                <div class="note-item">
                    ${data.content}
                    <br><small style="font-size:0.7em; color:gray;">By ${data.author}</small>
                </div>`;
        });

        if (notesList) notesList.innerHTML = html;
        if (previewList) previewList.innerHTML = html || "No notes yet...";
    });
}

// Update the window exposure section
window.addNote = addNote;

// Update window.onload to include loadNotes
window.onload = () => {
    loadMessages();
    loadNotes(); // Added this
    const nameEl = document.getElementById("chatName") || document.getElementById("homeName");
    if (nameEl) {
        nameEl.innerText = localStorage.getItem("chatName") || "My Person 💜";
    }
};

// ===================== 🎨 BACKGROUND & PROFILE UI =====================

// Function to handle Background change
window.setBackground = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            const chatBox = document.getElementById("chatBox");
            if (chatBox) {
                // Applying directly to style for immediate mobile feedback
                chatBox.style.backgroundImage = `url('${imageUrl}')`;
                chatBox.style.backgroundSize = "cover";
                chatBox.style.backgroundPosition = "center";
            }
            localStorage.setItem("chatBG", imageUrl);
        };
        reader.readAsDataURL(file);
    }
};

// Function to handle Profile Picture change
window.setProfile = (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            const dp = document.getElementById("profilePic");
            if (dp) dp.src = imageUrl;
            localStorage.setItem("chatDP", imageUrl);
        };
        reader.readAsDataURL(file);
    }
};

// Update the existing window.onload to reload these images
const originalOnload = window.onload;
window.onload = () => {
    if (originalOnload) originalOnload();

    // Load saved Background
    const savedBG = localStorage.getItem("chatBG");
    const chatBox = document.getElementById("chatBox");
    if (savedBG && chatBox) {
        chatBox.style.backgroundImage = `url(${savedBG})`;
        chatBox.style.backgroundSize = "cover";
        chatBox.style.backgroundPosition = "center";
    }

    // Load saved Profile Picture
    const savedDP = localStorage.getItem("chatDP");
    const dp = document.getElementById("profilePic");
    if (savedDP && dp) {
        dp.src = savedDP;
    }
};
