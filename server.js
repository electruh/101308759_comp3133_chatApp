const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser'); // Import body-parser
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Use body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const userModel = require('./model/User');
const gmModel = require('./model/GroupChat');
const pmModel = require('./model/PrivateChat');

// MongoDB-
const mongoDB = 'mongodb+srv://allanissumaya22:Allanismongopass22@cluster0.zap8277.mongodb.net/comp3133_labtest1?retryWrites=true&w=majority';
mongoose.connect(mongoDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(success => {
    console.log('MongoDB connected');
}).catch(err => {
    console.log('Error while MongoDB connection');
});

const formatMessage = require('./model/message');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
} = require('./model/users');

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = "Chat Master";

io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        socket.emit('message', formatMessage(botName, 'Welcome back'));

        socket.broadcast
            .to(user.room)
            .emit(
                'message',
                formatMessage(botName, `${user.username} has joined the chat`)
            );

        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if (user) {
            io.to(user.room).emit(
                'message',
                formatMessage(botName, `${user.username} has left the chat`)
            );

            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});


// Signup route
app.post('/signup', async (request, response) => {
    const { username, password, firstname, lastname } = request.body;

    try {
        // Check if the username is already taken
        const existingUser = await userModel.findOne({ username });

        if (existingUser) {
            // Redirect to signup page with username error message
            response.redirect('/signup?error=usernameTaken');
        } else {
            // Create a new user
            const newUser = new userModel({
                username,
                password,
                firstname,
                lastname,
                createon: new Date().toLocaleString(),
            });

            // Save the new user to the database
            await newUser.save();

            // Redirect to login page or send a success message
            response.redirect('/login?signup=success');
        }
    } catch (error) {
        // Handle other errors
        console.error(error);
        response.status(500).send('Internal Server Error');
    }
});


// Signup route
app.get('/signup', (request, response) => {
    response.sendFile(path.join(__dirname, '/public/signup.html'));
});

// Login routes
app.get('/login', (request, response) => {
    response.sendFile(path.join(__dirname, '/public/login.html'));
});

app.post('/login', async (request, response) => {
    const { username, password } = request.body;

    try {
        // Check if the user exists in the database
        const user = await userModel.findOne({ username });

        if (user) {
            // Check if the password is correct
            if (user.password === password) {
                // Redirect to the chat page or send a success message
                response.redirect(`/chat/${user.room}`);
            } else {
                // Redirect to login page with password error message
                response.redirect('/login?error=password');
            }
        } else {
            // Redirect to login page with username error message
            response.redirect('/login?error=username');
        }
    } catch (error) {
        // Handle other errors
        console.error(error);
        response.status(500).send('Internal Server Error');
    }
});

// Root route
app.get('/', (request, response) => {
    response.sendFile(path.join(__dirname, '/public/login.html'));
});

app.post('/', async (request, response) => {
    const { username, password } = request.body;

    try {
        // Check if the user exists in the database
        const user = await userModel.findOne({ username });

        if (user) {
            // Check if the password is correct
            if (user.password === password) {
                // Redirect to the chat page or send a success message
                response.redirect(`/chat/${user.room}`);
            } else {
                // Redirect to login page with password error message
                response.redirect('/?error=password');
            }
        } else {
            // Redirect to login page with username error message
            response.redirect('/?error=username');
        }
    } catch (error) {
        // Handle other errors
        console.error(error);
        response.status(500).send('Internal Server Error');
    }
});

// Chat route
app.get('/chat/:room', async (request, response) => {
    const room = request.params.room;
    const messages = await gmModel.find({ room }).sort({ 'date_sent': 'desc' }).limit(10);

    if (messages.length !== 0) {
        response.send(messages);
    } else {
        response.redirect('/signup');
    }
});

app.post('/chat', async (request, response) => {
    const { username, room, message } = request.body;

    try {
        // Save the chat message to the database (gmModel)
        const newMessage = new gmModel({
            from_user: username,
            room,
            message,
            date_sent: new Date().toLocaleString(),
        });
        await newMessage.save();

        // Emit the chat message to all users in the room
        io.to(room).emit('message', formatMessage(username, message));

        response.status(200).send('Message sent successfully');
    } catch (error) {
        // Handle errors
        console.error(error);
        response.status(500).send('Internal Server Error');
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
