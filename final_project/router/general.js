const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Simulating database delay with Promises
const fetchBooks = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(books);
        }, 500); // Simulating database delay of 500ms
    });
};

// Register a new user (Async)
public_users.post("/register", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (await isValid(username)) {
        return res.status(409).json({ message: "User already exists" });
    }

    users.push({ username, password });
    return res.status(201).json({ message: "User successfully registered" });
});

// Get the book list available in the shop (Async)
public_users.get('/', async (req, res) => {
    try {
        const allBooks = await fetchBooks();
        return res.status(200).json({ books: allBooks });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching books" });
    }
});

// Get book details based on ISBN (Async)
public_users.get('/isbn/:isbn', async (req, res) => {
    const { isbn } = req.params;
    const allBooks = await fetchBooks();

    if (!allBooks[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }
    return res.status(200).json({ book: allBooks[isbn] });
});

// Get book details based on author (Async)
public_users.get('/author/:author', async (req, res) => {
    const { author } = req.params;
    const allBooks = await fetchBooks();
    const result = Object.values(allBooks).filter(book => book.author.toLowerCase() === author.toLowerCase());

    if (result.length === 0) {
        return res.status(404).json({ message: "No books found by this author" });
    }
    return res.status(200).json({ books: result });
});

// Get all books based on title (Async)
public_users.get('/title/:title', async (req, res) => {
    const { title } = req.params;
    const allBooks = await fetchBooks();
    const result = Object.values(allBooks).filter(book => book.title.toLowerCase() === title.toLowerCase());

    if (result.length === 0) {
        return res.status(404).json({ message: "No books found with this title" });
    }
    return res.status(200).json({ books: result });
});

// Get book reviews (Async)
public_users.get('/review/:isbn', async (req, res) => {
    const { isbn } = req.params;
    const allBooks = await fetchBooks();

    if (!allBooks[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }
    return res.status(200).json({ reviews: allBooks[isbn].reviews || {} });
});

module.exports.general = public_users;