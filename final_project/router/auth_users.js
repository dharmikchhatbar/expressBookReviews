const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Function to check if a username is already registered (Async)
const isValid = async (username) => {
    return new Promise((resolve) => {
        const exists = users.some(user => user.username === username);
        resolve(exists);
    });
};

// Function to authenticate user credentials (Async)
const authenticatedUser = async (username, password) => {
    return new Promise((resolve) => {
        const valid = users.some(user => user.username === username && user.password === password);
        resolve(valid);
    });
};

// Registered users can login (Async)
regd_users.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        const isAuthenticated = await authenticatedUser(username, password);

        if (!isAuthenticated) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        let accessToken = jwt.sign({ username }, "access", { expiresIn: "1h" });

        // Store token in session
        req.session.authorization = { accessToken, username };

        return res.status(200).json({ message: "Login successful", accessToken });
    } catch (error) {
        return res.status(500).json({ message: "Error processing login request" });
    }
});

// Add or update a book review (Authenticated Users Only)
regd_users.put("/auth/review/:isbn", async (req, res) => {
    try {
        const isbn = req.params.isbn;
        const review = req.body.review;
        const username = req.session.authorization.username;

        if (!review) {
            return res.status(400).json({ message: "Review content is required" });
        }

        if (!books[isbn]) {
            return res.status(404).json({ message: "Book not found" });
        }

        // Store the review asynchronously
        await new Promise((resolve) => {
            if (!books[isbn].reviews) {
                books[isbn].reviews = {};
            }
            books[isbn].reviews[username] = review;
            resolve();
        });

        return res.status(200).json({ message: "Review added/updated successfully", reviews: books[isbn].reviews });
    } catch (error) {
        return res.status(500).json({ message: "Error adding/updating review" });
    }
});

// Delete a book review (Authenticated Users Only)
regd_users.delete("/auth/review/:isbn", async (req, res) => {
    try {
        const isbn = req.params.isbn;
        const username = req.session.authorization.username;

        if (!books[isbn]) {
            return res.status(404).json({ message: "Book not found" });
        }

        if (!books[isbn].reviews || !books[isbn].reviews[username]) {
            return res.status(404).json({ message: "No review found for this user" });
        }

        // Delete the review asynchronously
        await new Promise((resolve) => {
            delete books[isbn].reviews[username];
            resolve();
        });

        return res.status(200).json({ message: "Review deleted successfully", reviews: books[isbn].reviews });
    } catch (error) {
        return res.status(500).json({ message: "Error deleting review" });
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;