const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/users");
const Movie = require("../db/movies");
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Review = require("../models/review");


const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).redirect("/signup");
    }
    jwt.verify(token, process.env.JWTSECRET, (err, decoded) => {
        if (err) {
            return res.status(401).redirect("/signup");
        }
        req.userId = decoded.userId;
        next();
    });
};

router.get("/", async (req, res) => {
    try {
        const movies = await Movie.find({});
        res.render("index", { movies });
    } catch (error) {
        console.error("Error rendering index page:", error);
        res.status(500).send("<h1>Error rendering index page</h1>");
    }
});

router.get("/dashboard", verifyToken, async (req, res) => {
    try {
        const dbUser = await User.findById(req.userId);
        const movies = await Movie.find({});
        res.render("dashboard", { userId: req.userId, user: dbUser, movies });
    } catch (error) {
        console.error("Error rendering dashboard page:", error);
        res.status(500).send("<h1>Error rendering dashboard page</h1>");
    }
});

router.get("/signup", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (token) {
            jwt.verify(token, process.env.JWTSECRET, (err, decoded) => {
                if (err) {
                    res.render("signup")
                } else {
                    res.redirect("/dashboard");
                }
            });
        } else {
            res.render("signup");
        }
    } catch (error) {
        res.status(500).send("<h1>Error rendering signup page</h1>");
    }
});

router.get("/login", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (token) {
            jwt.verify(token, process.env.JWTSECRET, (err, decoded) => {
                if (err) {
                    res.render("login");
                } else {
                    res.redirect("/dashboard");
                }
            });
        } else {
            res.render("login");
        }
    } catch (error) {
        console.error("Error rendering login page:", error);
        res.status(500).send("<h1>Error rendering login page</h1>");
    }
});


router.get("/movie/:id", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.render('signup');
        }
        jwt.verify(token, process.env.JWTSECRET, async (err, decoded) => {
            if (err) {
                return res.render('signup');
            }
            const { userId } = decoded;
            const movieId = req.params.id;
            const movie = await Movie.findById(movieId).exec();
            const reviews = await Review.find();

            const userNameReview = await User.findById(userId).exec();
            const { username } = userNameReview;
            if (!movie) {
                return res.send('<h1>Movie not found</h1>');
            }
            res.render("moviesDetails", { userId, movie, username, reviews });
        });
    } catch (error) {
        console.error("Error rendering movie details page:", error);
        res.send('<h1>Movie error page</h1>');
    }
});


const razorpay = new Razorpay({
    key_id: process.env.KEYID,
    key_secret: process.env.KEYSECRET
});

router.get("/api/v1/logout", (req, res) => {
    res.clearCookie('token').redirect("/login");
});

router.post("/api/v1/users", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).send("<h2>Please provide username, email, and password</h2>");
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).send("<h2>Username already exists</h2>");
        }
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(400).send("<h2>Email already exists</h2>");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });
        await newUser.save();
        const token = jwt.sign({ userId: newUser._id }, process.env.JWTSECRET, { expiresIn: "1h" });
        res.status(201).cookie('token', token).redirect("/dashboard");
    } catch (error) {
        console.error("Error:", error); // Log the error
        if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
            return res.status(400).send("<h2>Email already exists</h2>");
        }
        if (error.code === 11000 && error.keyPattern && error.keyPattern.username) {
            return res.status(400).send("<h2>Username already exists</h2>");
        }
        res.status(500).send("<h2>Internal server error</h2>");
    }
});

router.post("/api/v1/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).send("<h2>Please provide username and password</h2>");
        }
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).send("<h2>User not found</h2>");
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).send("<h2>Incorrect password</h2>");
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWTSECRET, { expiresIn: "1h" });
        res.status(200).cookie('token', token).redirect("/dashboard");
    } catch (error) {
        console.error("Error:", error); // Log the error
        res.status(500).send("<h2>Internal server error</h2>");
    }
});


router.post("/api/v1/movies", async (req, res) => {
    try {
        const { price, location, date, time, title, description, thumbnail } = req.body;
        if (!price || !location || !date || !time || !title || !description) {
            return res.status(400).json({ error: "Please provide all required fields" });
        }
        const newMovie = new Movie({
            price,
            location,
            date,
            time,
            title,
            description,
            thumbnail
        });
        await newMovie.save();
        res.status(201).json(newMovie);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/api/booking/:postId", async (req, res) => {
    try {
        const { postId } = req.params;
        const movie = await Movie.findById(postId);
        if (!movie) {
            return res.status(404).json({ message: 'Movie post not found' });
        }
        const priceINR = Number(movie.price);
        const options = {
            amount: priceINR * 100,
            currency: "INR",
            receipt: `receipt_order_${postId}`,
        };
        const order = await razorpay.orders.create(options);
        res.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/api/payment/verify', async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const hmac = crypto.createHmac('sha256', process.env.KEYSECRET);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generated_signature = hmac.digest('hex');
        if (generated_signature === razorpay_signature) {
            res.json({ success: true });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/reviews', async (req, res) => {
    try {
        const { review, post } = req.body;
        const newReview = new Review({ review, post });
        await newReview.save(); // Save the new review

        // Find the user who posted the review and update their posts array
        const user = await User.findById(post); // Assuming 'post' contains the user's ID
        if (user) {
            user.posts.push(newReview._id); // Push the ID of the new review into the user's posts array
            await user.save(); // Save the updated user object
        } else {
            throw new Error("User not found");
        }

        // Fetch movies and reviews for rendering the dashboard
        const movies = await Movie.find({}).exec();
        const reviews = await Review.find();

        // Render the dashboard with updated data
        res.status(201).render("dashboard", { movies, reviews });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
module.exports = router;
