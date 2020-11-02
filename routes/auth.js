"use strict";

const Router = require("express").Router;
const router = new Router();
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config.js")

const User = require("../models/user.js");
const { BadRequestError } = require("../expressError.js");

/** POST /login: {username, password} => {token} */

router.post("/login", async function(req, res, next) {
    try {
        const { username, password } = req.body;
        if (!await User.authenticate(username, password)) {
            throw new BadRequestError("Invalid user/password");
        }
        const token = jwt.sign({ username }, SECRET_KEY);
        return res.status(200).json({ token });
    } catch (err) {
        return next(err);
    }
})

/** POST /register: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 */
router.post("/register", async function(req, res, next) {
    try {
        const {
            username,
            password,
            first_name,
            last_name,
            phone
        } = req.body;

        let user = await User.register({ username, password, first_name, last_name, phone });
        let token = jwt.sign({ username }, SECRET_KEY);
        return res.status(200).json({ token });

    } catch (err) {
        return next(err);
    }
})

module.exports = router;