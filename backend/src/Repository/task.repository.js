const db = require('../Config/db');

async function createTask(userId, title, description, status = 'pending', priority = 'medium', category = 'General', dueDate = null) {
    const sql = `
        INSERT INTO tasks (user_id, title, description, status, priority, category, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [userId, title, description, status, priority, category, dueDate]);
    return result;
}

async function findTasksByUserId(userId, filters = {}) {
    let sql = `
        SELECT id, user_id, title, description, status, priority, category, due_date, created_at, updated_at
        FROM tasks
        WHERE user_id = ?
    `;
    const params = [userId];

    if (filters.status) {
        sql += ` AND status = ?`;
        params.push(filters.status);
    }

    if (filters.sortBy === 'dueDate') {
        sql += ` ORDER BY due_date IS NULL, due_date ASC, created_at DESC`;
    } else {
        sql += ` ORDER BY created_at DESC`;
    }

    const [rows] = await db.execute(sql, params);
    return rows;
}

async function findTaskByIdAndUserId(taskId, userId) {
    const sql = `
        SELECT id, user_id, title, description, status, priority, category, due_date, created_at, updated_at
        FROM tasks
        WHERE id = ? AND user_id = ?
    `;
    const [rows] = await db.execute(sql, [taskId, userId]);
    return rows[0] || null;
}

async function updateTask(taskId, userId, title, description, status, priority, category, dueDate) {
    const sql = `
        UPDATE tasks
        SET title = ?, description = ?, status = ?, priority = ?, category = ?, due_date = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
    `;
    const [result] = await db.execute(sql, [title, description, status, priority, category, dueDate, new Date(), taskId, userId]);
    return result;
}

async function deleteTask(taskId, userId) {
    const sql = `
        DELETE FROM tasks
        WHERE id = ? AND user_id = ?
    `;
    const [result] = await db.execute(sql, [taskId, userId]);
    return result;
}

module.exports = {
    createTask,
    findTasksByUserId,
    findTaskByIdAndUserId,
    updateTask,
    deleteTask
};