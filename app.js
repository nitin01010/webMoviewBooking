require('dotenv').config()
const express = require("express");
const Path = require("path");
const app = express();

app.use(express.static(Path.join(__dirname, 'public')));
let cookieParser = require('cookie-parser');
app.use(cookieParser())

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", Path.resolve("./views"));
app.use(require("./routes/apiRoutes"));
app.use(require("./routes/renderRoutes"));
require("./db/dbConnection")

app.listen(process.env.PORT, () => {
    console.log('server is woking');
});
