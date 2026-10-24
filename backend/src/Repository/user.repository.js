const db = require('../Config/db');

async function createUser(name, email, password) {
    const sql = `
        INSERT INTO users (name, email, password) VALUES (?, ?, ?)
    `;
    const [result] = await db.execute(sql, [name, email, password]);
    return result;
}

async function findUserByEmail(email) {
    const sql = `
        SELECT * FROM users WHERE email = ?
    `;
    const [rows] = await db.execute(sql, [email]);
    return rows[0] || null;
}

async function updatePassword(userId, newPasswordHash) {
    const sql = `
        UPDATE users SET password = ? WHERE id = ?
    `;
    const [result] = await db.execute(sql, [newPasswordHash, userId]);
    return result;
}

module.exports = {
    createUser,
    findUserByEmail,
    updatePassword
};
