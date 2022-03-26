const dataWorker = require("../data/authData");
const jwt = require("jsonwebtoken");

async function routeQuarter(req, res, next) {
    const { query } = req;
    if (query.id) checkEmail(req, res, next);
    else changePassword(req, res, next);
}

async function join(req, res, next) {
    const { email, nickname, password, repassword } = req.body;
    let result;

    try {
        const exEmail = await dataWorker.FindEmailToJoin(email);
        const exNick = await dataWorker.FindNick(nickname);
        const exPass = dataWorker.MatchPasswordToLogin(password, repassword);
        const hash = await dataWorker.MakeHash(exPass);
        result = await dataWorker.MakeUser(exEmail, exNick, hash);
    } catch (err) {
        if (err.message === "Exist Email") {
            console.error(err);
            return res.status(401).json({
                code: 401,
                message: "Failed to join, The email is exist",
            });
        } else if (err.message === "Exist Nickname") {
            console.error(err);
            return res.status(401).json({
                code: 401,
                message: "Failed to join, The nickname is exist",
            });
        } else if (err.message === "Password Inconsistency") {
            console.error(err);
            return res.status(401).json({
                code: 401,
                message: "Failed to join, The password is not matching",
            });
        }
        return next(err);
    }

    return res.status(201).json({
        code: 201,
        message: "Sucess to join",
        result,
    });
}

async function login(req, res, next) {
    const { email, password } = req.body;
    const auth = req.get("authorization");
    const check = dataWorker.checkToLogin(auth);
    if (check) {
        let user;

        try {
            user = await dataWorker.FindUserToLogin(email);
            await dataWorker.FindPassword(password, user);
        } catch (err) {
            if (err.message === "Nonexist Email") {
                console.error(err);
                return res.status(401).json({
                    code: 401,
                    message: "Failed to login, The email or password are invalid",
                });
            } else if (err.message === "Invalid Password") {
                console.error(err);
                return res.status(401).json({
                    code: 401,
                    message: "Failed to login, The email or password are invalid",
                });
            }
            return next(err);
        }
        const token = dataWorker.createJwtToken(user);
        const result = {};

        result.user = user.dataValues;
        result.token = token;
        return res.status(200).json({
            code: 200,
            message: "Sucess to login and a token has been verifyed",
            result,
        });
    } else {
        return res.status(401).json({
            code: 401,
            message: "You are already logged in",
        });
    }
}

async function checkEmail(req, res, next) {
    const queryId = req.query.id;
    let result;

    try {
        result = await dataWorker.FindEmailToGet(queryId);
    } catch (err) {
        if (err.message === "Nonexist Id") {
            return res.status(401).json({
                code: 401,
                message: "Failed to find email with user's id",
            });
        }
        console.error(err);
        return next(err);
    }

    return res.status(200).json({
        code: 200,
        message: "Sucess to check email with user's id",
        result,
    });
}

async function changePassword(req, res, next) {
    const { nowPassword, newPassword } = req.body;
    const { email } = req.query;

    try {
        const user = await dataWorker.FindUserToCheck(email);
        const userPassword = user.dataValues.password;

        await dataWorker.MatchPasswordToModify(nowPassword, userPassword);
    } catch (err) {
        if (err.message === "Nonexist User") {
            return res.status(401).json({
                code: 401,
                message: "Failed to find, The user is nonexist",
            });
        }
        console.error(err);
        return next(err);
    }

    res.send("Test");
}

async function me(req, res) {
    const nickname = req.decoded.user.nickname;
    const authority = req.authority;
    if (req.authority === "master") {
        return res.status(200).json({
            code: 200,
            message: "The token is valid, welcome master",
            nickname,
            authority,
        });
    }
    return res.status(200).json({
        code: 200,
        message: "The tokein is valid",
        nickname,
        authority,
    });
}

async function logout(req, res, next) {
    let jwtToken = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    jwtToken = "";

    return res.status(200).json({
        code: 200,
        message: "Sucess to logout",
        jwtToken,
    });
}

module.exports = {
    join,
    login,
    me,
    checkEmail,
    changePassword,
    logout,
    routeQuarter,
};
