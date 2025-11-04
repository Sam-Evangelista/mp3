const Task = require('../models/task');

async function getTask(req, res, next) {
    try {
        task = await Task.findById(req.params.id);
        if (task == null) {
            return res.fail('Cannot find task', 404);
        }
    } catch (err) {
        return res.fail(err.message, 500);
    }
    res.task = task;
    next();
}

module.exports = function (router) {
    router.get('/', async (req, res) => {
        try {
            const tasks = await Task.find();
            return res.success(tasks);
        } catch (err) {
            return res.fail(err.message, 500);
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
            return res.success(newTask, 'Created', 201);
        } catch (err) {
            return res.fail(err.message, 400);
        }
    });

    router.get('/:id', getTask, (req, res) => {
        return res.success(res.task);
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
            return res.success(updatedTask);
        } catch (err) {
            return res.fail(err.message, 400);
        }
    });

    router.delete('/:id', getTask, async (req, res) => {
        try {
            await res.task.remove();
            return res.success(null, 'Deleted');
        } catch (err) {
            return res.fail(err.message, 500);
        }
    });

    return router;
}
