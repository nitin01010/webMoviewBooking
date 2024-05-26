const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/users");
const Movie = require("../db/movies");

router.get("/", async (req, res) => {
    try {
        const token = req.cookies.token;

        if (token) {
            jwt.verify(token, process.env.JWTSECRET, async (err, decoded) => {
                const movies = await Movie.find({}).exec();
                if (err) {
                    res.render("index", { movies });
                } else {
                    const { userId } = decoded;
                    res.render("dashboard", { movies, userId });
                }
            });
        } else {
            const movies = await Movie.find({}).exec();
            res.render("index", { movies });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send("<h1>Error rendering index page</h1>");
    }
});

router.get("/dashboard", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (token) {
            jwt.verify(token, process.env.JWTSECRET, async (err, decoded) => {
                if (err) {
                    res.status(401).redirect("/");
                } else {
                    const { userId } = decoded;
                    try {
                        const dbUser = await User.findById(userId).exec();
                        if (dbUser) {
                            const movies = await Movie.find({}).exec();
                            res.render("dashboard", { userId, user: dbUser, movies });
                        } else {
                            res.status(404).redirect("/");
                        }
                    } catch (dbError) {
                        console.error(dbError);
                        res.status(500).redirect("/");
                    }
                }
            });
        } else {
            res.redirect("/signup");
        }
    } catch (error) {
        console.error(error);
        res.status(500).redirect("/");
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
            const userNameReview = await User.findById(userId).exec();
            const { username } = userNameReview;
            if (!movie) {
                return res.send('<h1>Movie not found</h1>');
            }
            res.render("moviesDetails", { userId, movie, username });
        });
    } catch (error) {
        console.error("Error rendering movie details page:", error);
        res.send('<h1>Movie error page</h1>');
    }
});



module.exports = router;
