"use strict";

/** User of the site. */
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config.js");
const db = require("../db.js");

class User {

    /** Register new user. Returns
     *    {username, password, first_name, last_name, phone}
     *  username TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        join_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        last_login_at TIMESTAMP WITH TIME ZONE
     */

    static async register({ username, password, first_name, last_name, phone }) {
        const hashedPwd = await bcrypt.hash(password, BCRYPT_WORK_FACTOR)
        const result = await db.query(
            `INSERT INTO users (username,
                               password,
                               first_name,
                               last_name,
							   phone,
							   join_at,
							   last_login_at)
           VALUES
             ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
		   RETURNING username, password, first_name, last_name, phone`, [username, hashedPwd, first_name, last_name, phone]);
        return result.rows[0];
    }

    /** Authenticate: is username/password valid? Returns boolean. */

    static async authenticate(username, password) {
        const result = await db.query(
            `SELECT password 
			FROM users 
			WHERE username = $1;`, [username]);
        const user = result.rows[0]
        if (user) {
            if (await bcrypt.compare(password, user.password) === true) {
                this.updateLoginTimestamp(username);
                return true;
            }
        }
        return false;
    }

    /** Update last_login_at for user */

    static async updateLoginTimestamp(username) {
        const result = await db.query(
            `UPDATE users 
			SET last_login_at = current_timestamp
			WHERE username = $1
			returning username, last_login_at`, [username]);
        return result.rows[0];
    }

    /** All: basic info on all users:
     * [{username, first_name, last_name}, ...] */

    static async all() {
        const results = await db.query(
            `SELECT username, first_name, last_name 
			FROM users;`);
        return results.rows;
    }

    /** Get: get user by username
     *
     * returns {username,
     *          first_name,
     *          last_name,
     *          phone,
     *          join_at,
     *          last_login_at } */

    static async get(username) {
        const result = await db.query(
            `SELECT username, first_name, last_name, phone, join_at, last_login_at
			FROM users
			WHERE username = $1;`, [username]);
        return result.rows[0];
    }

    /** Return messages from this user.
     *
     * [{id, to_user, body, sent_at, read_at}]
     *
     * where to_user is
     *   {username, first_name, last_name, phone}
     */

    static async messagesFrom(username) {
        const results = await db.query(
            `SELECT m.id, m.body, m.sent_at, m.read_at,
			FROM messages as m
			WHERE m.from_username = $1
		`, [username])
        return results.rows;
    }

    /** Return messages to this user.
     *
     * [{id, from_user, body, sent_at, read_at}]
     *
     * where from_user is
     *   {id, first_name, last_name, phone}
     */

    static async messagesTo(username) {}
}


module.exports = User;