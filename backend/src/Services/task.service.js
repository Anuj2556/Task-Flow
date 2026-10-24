const taskRepo = require('../Repository/task.repository');

const ALLOWED_STATUSES = ['pending', 'in-progress', 'completed'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high'];

function parseAndValidateDueDate(dateStr) {
    if (!dateStr) return null;
    const parsedDate = new Date(dateStr);

    if (isNaN(parsedDate.getTime())) {
        throw new Error('INVALID_DUE_DATE');
    }
    return parsedDate.toISOString().split('T')[0];
}

async function createTask(userId, { title, description, status, priority, category, dueDate }) {
    if (!title || !title.trim()) {
        throw new Error('TITLE_REQUIRED');
    }

    const taskStatus = status || 'pending';
    if (!ALLOWED_STATUSES.includes(taskStatus)) {
        throw new Error('INVALID_STATUS');
    }

    const taskPriority = priority ? priority.toLowerCase() : 'medium';
    if (!ALLOWED_PRIORITIES.includes(taskPriority)) {
        throw new Error('INVALID_PRIORITY');
    }

    const taskCategory = category && category.trim() ? category.trim() : 'General';
    const formattedDueDate = parseAndValidateDueDate(dueDate);

    const result = await taskRepo.createTask(
        userId,
        title.trim(),
        description ? description.trim() : '',
        taskStatus,
        taskPriority,
        taskCategory,
        formattedDueDate
    );

    return {
        id: result.insertId,
        user_id: userId,
        title: title.trim(),
        description: description ? description.trim() : '',
        status: taskStatus,
        priority: taskPriority,
        category: taskCategory,
        due_date: formattedDueDate
    };
}

async function getAllTasks(userId, query = {}) {
    const filters = {};

    if (query.status && ALLOWED_STATUSES.includes(query.status)) {
        filters.status = query.status;
    }

    if (query.sortBy === 'dueDate') {
        filters.sortBy = 'dueDate';
    }

    return await taskRepo.findTasksByUserId(userId, filters);
}

async function getTaskById(taskId, userId) {
    const task = await taskRepo.findTaskByIdAndUserId(taskId, userId);
    if (!task) {
        throw new Error('TASK_NOT_FOUND');
    }
    return task;
}

async function updateTask(taskId, userId, updateData) {
    const existingTask = await taskRepo.findTaskByIdAndUserId(taskId, userId);
    if (!existingTask) {
        throw new Error('TASK_NOT_FOUND');
    }

    const title = updateData.title !== undefined ? updateData.title.trim() : existingTask.title;
    const description = updateData.description !== undefined ? updateData.description.trim() : existingTask.description;
    const status = updateData.status !== undefined ? updateData.status : existingTask.status;
    const priority = updateData.priority !== undefined ? updateData.priority.toLowerCase() : (existingTask.priority || 'medium');
    const category = updateData.category !== undefined ? updateData.category.trim() : (existingTask.category || 'General');

    if (!title) {
        throw new Error('TITLE_REQUIRED');
    }

    if (updateData.status && !ALLOWED_STATUSES.includes(updateData.status)) {
        throw new Error('INVALID_STATUS');
    }

    if (updateData.priority && !ALLOWED_PRIORITIES.includes(updateData.priority.toLowerCase())) {
        throw new Error('INVALID_PRIORITY');
    }

    const dueDate = updateData.dueDate !== undefined
        ? parseAndValidateDueDate(updateData.dueDate)
        : existingTask.due_date;

    await taskRepo.updateTask(taskId, userId, title, description, status, priority, category, dueDate);

    return {
        id: Number(taskId),
        user_id: userId,
        title,
        description,
        status,
        priority,
        category,
        due_date: dueDate
    };
}

async function deleteTask(taskId, userId) {
    const existingTask = await taskRepo.findTaskByIdAndUserId(taskId, userId);
    if (!existingTask) {
        throw new Error('TASK_NOT_FOUND');
    }

    await taskRepo.deleteTask(taskId, userId);
    return { id: Number(taskId) };
}

module.exports = {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask
};