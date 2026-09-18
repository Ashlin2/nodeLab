const express = require("express");
const fs = require("fs");
const EventEmitter = require("events");

const app = express();

const PORT = 3000;

const usersFile = "users.json";
const auditFile = "audit.log";


// Middleware
app.use(express.json());

app.use(express.static("public"));


// Create EventEmitter
const userEvents = new EventEmitter();


// Read users from users.json
function readUsers() {

    try {

        const data = fs.readFileSync(usersFile, "utf8");

        return JSON.parse(data);

    } catch (error) {

        return [];

    }
}


// Save users to users.json
function saveUsers(users) {

    fs.writeFileSync(
        usersFile,
        JSON.stringify(users, null, 2)
    );

}


// SIGN UP EVENT
userEvents.on("signup", (user) => {

    const message =
        `[${new Date().toLocaleString()}] SIGNUP: ${user.email}\n`;

    fs.appendFileSync(auditFile, message);

    console.log(message.trim());

});


// LOGIN EVENT
userEvents.on("login", (user) => {

    const message =
        `[${new Date().toLocaleString()}] LOGIN: ${user.email}\n`;

    fs.appendFileSync(auditFile, message);

    console.log(message.trim());

});


// SIGN UP ROUTE
app.post("/signup", (req, res) => {

    const { name, email, password } = req.body;


    // Check empty fields
    if (!name || !email || !password) {

        return res.status(400).json({
            success: false,
            message: "Please fill in all fields."
        });

    }


    // Read users
    const users = readUsers();


    // Check existing email
    const existingUser = users.find(
        user => user.email.toLowerCase() === email.toLowerCase()
    );


    if (existingUser) {

        return res.status(400).json({
            success: false,
            message: "Email already registered."
        });

    }


    // Create new user
    const newUser = {
        name: name,
        email: email,
        password: password
    };


    // Add user
    users.push(newUser);


    // Save user
    saveUsers(users);


    // Emit signup event
    userEvents.emit("signup", newUser);


    // Send response
    res.json({
        success: true,
        message: "Registration successful!"
    });

});


// LOGIN ROUTE
app.post("/login", (req, res) => {

    const { email, password } = req.body;


    // Check empty fields
    if (!email || !password) {

        return res.status(400).json({
            success: false,
            message: "Please enter email and password."
        });

    }


    // Read users
    const users = readUsers();


    // Find user
    const user = users.find(
        user =>
            user.email.toLowerCase() === email.toLowerCase() &&
            user.password === password
    );


    // User not found
    if (!user) {

        return res.status(401).json({
            success: false,
            message: "Invalid email or password."
        });

    }


    // Emit login event
    userEvents.emit("login", user);


    // Send success response
    res.json({
        success: true,
        message: "Login successful!",
        name: user.name
    });

});


// Start server
app.listen(PORT, () => {

    console.log(`Server running at http://localhost:${PORT}`);

});