const bcrypt = require('bcryptjs')
const userRepo = require('../Repository/user.repository');
const { generateToken } = require('../utils/jwt');


async function registerUser(name, email, password) {
    const existingUser = await userRepo.findUserByEmail(email)

    if (existingUser) {
        throw new Error("EMAIL ALREADY EXISTS")
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await userRepo.createUser(name, email, hashedPassword);

    const token = generateToken({
        id: result.insertId,
        email
    });

    return {
        token,
        user: {
            id: result.insertId,
            name,
            email
        }
    };
}

async function loginUser(email, password) {
    const user = await userRepo.findUserByEmail(email);

    if (!user) {
        throw new Error("Invalid_Credentials")
    }

    let isPasswordValid = false;

    // Check if password stored in DB is legacy plain text
    if (!user.password.startsWith('$2')) {
        if (user.password === password) {
            isPasswordValid = true;
            // Upgrade legacy password to bcrypt hash in DB
            const newHashed = await bcrypt.hash(password, 10);
            await userRepo.updatePassword(user.id, newHashed);
        }
    } else {
        isPasswordValid = await bcrypt.compare(password, user.password);
    }

    if (!isPasswordValid) {
        throw new Error('Invalid_Credentials');
    }

    const token = generateToken({
        id: user.id,
        email: user.email
    })

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    }
}

module.exports = {
    registerUser,
    loginUser
}