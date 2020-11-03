"use strict";

const Router = require("express").Router;
const router = new Router();
const { authenticateJWT, ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth.js")
const Message = require("../models/message.js");
const { BadRequestError, UnauthorizedError } = require("../expressError.js");
/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Makes sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async function(req, res, next) {
    try {
        const id = req.params.id;
        const message = await Message.get(id);
        const currentUser = res.locals.user.username;
        const message_from = message.from_user.username;
        const message_to = message.to_user.username;
        if (currentUser !== message_from && currentUser !== message_to) {
            throw new UnauthorizedError("Not sender or reciever");
        }
        return res.status(200).json({ message });
    } catch (err) {
        return next(err);
    }
})

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async function(req, res, next) {
    try {
        const { to_username, body } = req.body;
        console.log(to_username)
        const from_username = res.locals.user.username;
        const message = await Message.create({ from_username, to_username, body });

        return res.status(200).json({ message });
    } catch (err) {
        return next(err);
    }
})

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Makes sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async function(req, res, next) {
    try {
        const id = req.params.id;
        const loggedInUser = res.locals.user.username;
        let message = await Message.get(id);
        if (message.to_user.username !== loggedInUser) {
            throw new UnauthorizedError("Only recipient can mark as read");
        }
        message = await Message.markRead(id);
        return res.status(200).json({ message });
    } catch (err) {
        return next(err);
    }
})

module.exports = router;