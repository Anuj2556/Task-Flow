const taskService = require('../Services/task.service');

async function createTask(req, res) {
    try {
        const userId = req.user.id;
        const { title, description, status, priority, category, dueDate } = req.body;

        const task = await taskService.createTask(userId, { title, description, status, priority, category, dueDate });

        return res.status(201).json({
            message: 'Task created successfully',
            task
        });
    } catch (err) {
        console.error('Create Task Error:', err.message);

        if (err.message === 'TITLE_REQUIRED') {
            return res.status(400).json({ message: 'Title is required' });
        }
        if (err.message === 'INVALID_STATUS') {
            return res.status(400).json({ message: 'Invalid status' });
        }
        if (err.message === 'INVALID_PRIORITY') {
            return res.status(400).json({ message: 'Invalid priority. Use low, medium, or high' });
        }
        if (err.message === 'INVALID_DUE_DATE') {
            return res.status(400).json({ message: 'Invalid due date format.' });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}

async function getAllTasks(req, res) {
    try {
        const userId = req.user.id;
        const tasks = await taskService.getAllTasks(userId, req.query);
        return res.status(200).json({
            count: tasks.length,
            tasks
        });
    } catch (err) {
        console.error('Get Tasks Error:', err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getTaskById(req, res) {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        const task = await taskService.getTaskById(taskId, userId);
        return res.status(200).json({ task });
    } catch (err) {
        console.error('Get Task Error:', err.message);
        if (err.message === 'TASK_NOT_FOUND') {
            return res.status(404).json({ message: 'Task not found' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function updateTask(req, res) {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        const { title, description, status, priority, category, dueDate } = req.body;
        const task = await taskService.updateTask(taskId, userId, {
            title,
            description,
            status,
            priority,
            category,
            dueDate
        });
        return res.status(200).json({
            message: 'Task updated successfully',
            task
        });
    } catch (err) {
        console.error('Update Task Error:', err.message);
        if (err.message === 'TASK_NOT_FOUND') {
            return res.status(404).json({ message: 'Task not found' });
        }
        if (err.message === 'TITLE_REQUIRED') {
            return res.status(400).json({ message: 'Title cannot be empty' });
        }
        if (err.message === 'INVALID_STATUS') {
            return res.status(400).json({ message: 'Status must be pending, in-progress, or completed' });
        }
        if (err.message === 'INVALID_PRIORITY') {
            return res.status(400).json({ message: 'Priority must be low, medium, or high' });
        }
        if (err.message === 'INVALID_DUE_DATE') {
            return res.status(400).json({ message: 'Invalid due date format. Use YYYY-MM-DD or ISO string' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function deleteTask(req, res) {
    try {
        const userId = req.user.id;
        const taskId = req.params.id;
        await taskService.deleteTask(taskId, userId);
        return res.status(200).json({
            message: 'Task deleted successfully'
        });
    } catch (err) {
        console.error('Delete Task Error:', err.message);
        if (err.message === 'TASK_NOT_FOUND') {
            return res.status(404).json({ message: 'Task not found' });
        }
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask
};
