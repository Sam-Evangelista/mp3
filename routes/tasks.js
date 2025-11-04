const Task = require('../models/task');

async function getTask(req, res, next) {
    try {
        task = await Task.findById(req.params.id);
        if (task == null) {
            return res.status(404).json({ message: 'Cannot find task' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
    res.task = task;
    next();
}

module.exports = function (router) {
    router.get('/', async (req, res) => {
        try {
            const tasks = await Task.find();
            res.json(tasks);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    router.post('/', async (req, res) => {
        const task = new Task({
            name: req.body.name,
            description: req.body.description,
            deadline: req.body.deadline,
            completed: req.body.completed,
            assignedUser: req.body.assignedUser,
            assignedUserName: req.body.assignedUserName,
            dateCreated: req.body.dateCreated
        });

        try {
            const newTask = await task.save();
            res.status(201).json(newTask);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

    router.get('/:id', getTask, (req, res) => {
        res.json(res.task);
    });

    router.put('/:id', getTask, async (req, res) => {
        if (req.body.name != null) {
            res.task.name = req.body.name;
        }
        if (req.body.description != null) {
            res.task.description = req.body.description;
        }
        if (req.body.deadline != null) {
            res.task.deadline = req.body.deadline;
        }
        if (req.body.completed != null) {
            res.task.completed = req.body.completed;
        }
        if (req.body.assignedUser != null) {
            res.task.assignedUser = req.body.assignedUser;
        }
        if (req.body.assignedUserName != null) {
            res.task.assignedUserName = req.body.assignedUserName;
        }

        try {
            const updatedTask = await res.task.save();
            res.json(updatedTask);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    });

    router.delete('/:id', getTask, async (req, res) => {
        try {
            await res.task.remove();
            res.json({ message: 'Deleted Task' });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });

    return router;
}