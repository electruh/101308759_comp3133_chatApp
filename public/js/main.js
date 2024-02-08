document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const chatMessages = document.querySelector('.chat-messages');
    const usersList = document.getElementById('users');
    const typingMessage = document.getElementById('typing-message'); // Added this line

    const socket = io();

    // Get username and room from URL
    const { username, room } = Qs.parse(location.search, {
        ignoreQueryPrefix: true,
    });

    // Join chatroom
    socket.emit('joinRoom', { username, room });

    // Message from server
    socket.on('message', (message) => {
        outputMessage(message);
        // Scroll down
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    // Room users update
    socket.on('roomUsers', ({ users }) => {
        outputUsers(users);
    });

    // User typing feature
    const msgInput = document.getElementById('msg');

    msgInput.addEventListener('input', () => {
        socket.emit('typing');
    });

    socket.on('userTyping', (username) => {
        typingMessage.innerHTML = `${username} is typing...`;
    });

    socket.on('userStoppedTyping', (username) => {
        typingMessage.innerHTML = '';
    });

    // Message submit
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Stop typing when sending a message
        socket.emit('stopTyping');

        const msgInput = document.getElementById('msg');
        const message = msgInput.value;

        // Emit message to server
        socket.emit('chatMessage', message);

        // Clear input
        msgInput.value = '';
        msgInput.focus();
    });

    // Output message to DOM
    function outputMessage(message) {
        const div = document.createElement('div');
        div.classList.add('message');
        div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">${message.text}</p>`;
        chatMessages.appendChild(div);
    }

    // Output users to DOM
    function outputUsers(users) {
        usersList.innerHTML = '';
        users.forEach(user => {
            const li = document.createElement('li');
            li.innerText = user.username;
            usersList.appendChild(li);
        });
    }
});
