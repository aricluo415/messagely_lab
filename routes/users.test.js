"use strict";

const request = require("supertest");
const jwt = require("jsonwebtoken");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message")

describe("User Routes Test", function() {

    let _token;

    beforeEach(async function() {
        await db.query("DELETE FROM messages");
        await db.query("DELETE FROM users");

        let u1 = await User.register({
            username: "test1",
            password: "password",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
        });

        let response = await request(app)
            .post("/auth/login")
            .send({
                username: "test1",
                password: "password"
            });

        _token = response.body.token;
    });

    /** GET / - get list of users.  */

    describe("GET /user", function() {
        test("get list of users", async function() {

            let users = await request(app)
                .get("/users")
                .send({ _token });

            expect(users.body).toEqual({
                users: [{
                    first_name: "Test1",
                    last_name: "Testy1",
                    phone: "+14155550000",
                    username: "test1",
                }]
            });
        });
        test("have to be logged in", async function() {

            let user = await request(app)
                .get("/users")
                .send({ _token: "wrong_token" });

            expect(user.body).toEqual({
                error: {
                    "message": "Unauthorized",
                    "status": 401,
                }
            });
        })
    });

    /** GET /:username - get detail of users.  */

    describe("GET users/:username", function() {

        test("get user details", async function() {
            let user = await request(app)
                .get("/users/test1")
                .send({ _token });

            expect(user.body.user.first_name).toEqual("Test1");
            expect(user.body.user.last_name).toEqual("Testy1");
            expect(user.body.user.username).toEqual("test1");
            expect(user.body.user.phone).toEqual("+14155550000");
        });
        test("cannot get other user detail", async function() {
            let u1 = await User.register({
                username: "test2",
                password: "password",
                first_name: "Test2",
                last_name: "Testy2",
                phone: "+14155550000",
            });
            let response = await request(app)
                .post("/auth/login")
                .send({
                    username: "test2",
                    password: "password"
                });
            let u1_token = response.body.token;
            let user = await request(app)
                .get("/users/test1")
                .send({ _token: u1_token });

            expect(user.body).toEqual({
                error: {
                    "message": "Unauthorized",
                    "status": 401,
                }
            });
        });
    });

    /** GET /:username/to - get messages to user */
    describe("GET users/:username/to", function() {
        beforeEach(async function() {
            let u1 = await User.register({
                username: "test2",
                password: "password",
                first_name: "Test2",
                last_name: "Testy2",
                phone: "+14155550000",
            });
            let m1 = await Message.create({
                from_username: "test2",
                to_username: "test1",
                body: "hello"
            })
        });
        test("get user messages", async function() {

            let response = await request(app)
                .get("/users/test1/to")
                .send({ _token });
            const messages = response.body.messages;
            expect(messages[0].body).toEqual('hello');
            expect(messages[0].from_user.username).toEqual('test2');
        });
    });
});

afterAll(async function() {
    await db.end();
});