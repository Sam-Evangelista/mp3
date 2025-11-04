const Task = require('../models/task');

async function getTask(req, res, next) {
    try {
        const task = await Task.findById(req.params.id);
        if (task == null) {
            return res.fail('Cannot find task', 404);
        }
        res.task = task;
        next();
    } catch (err) {
        return res.fail(err.message, 500);
    }
}

module.exports = function (router) {
    router.get('/', async (req, res) => {
        try {
            let where = {};
            let sort = {};
            let select = {};

            if (req.query.where) {
                try { where = JSON.parse(req.query.where); }
                catch { return res.fail('Invalid JSON in where parameter', 400); }
            }

            if (req.query.sort) {
                try { sort = JSON.parse(req.query.sort); }
                catch { return res.fail('Invalid JSON in sort parameter', 400); }
            }

            if (req.query.select) {
                try { select = JSON.parse(req.query.select); }
                catch { return res.fail('Invalid JSON in select parameter', 400); }
            }

            const skip  = req.query.skip  ? parseInt(req.query.skip, 10)  : 0;
            const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
            const count = req.query.count === 'true';

            if (count) {
                const taskCount = await Task.countDocuments(where);
                return res.success(taskCount);
            }

            const tasks = await Task.find(where)
                .select(select)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .exec();

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

    // Note: no getTask middleware here so we can apply ?select
    router.get('/:id', async (req, res) => {
        let select = {};
        if (req.query.select) {
            try { select = JSON.parse(req.query.select); }
            catch { return res.fail('Invalid JSON in select parameter', 400); }
        }
        try {
            const task = await Task.findById(req.params.id).select(select).exec();
            if (!task) return res.fail('Cannot find task', 404);
            return res.success(task);
        } catch (err) {
            return res.fail('Invalid ID', 400);
        }
    });

    router.put('/:id', getTask, async (req, res) => {
        if (req.body.name != null) res.task.name = req.body.name;
        if (req.body.description != null) res.task.description = req.body.description;
        if (req.body.deadline != null) res.task.deadline = req.body.deadline;
        if (req.body.completed != null) res.task.completed = req.body.completed;
        if (req.body.assignedUser != null) res.task.assignedUser = req.body.assignedUser;
        if (req.body.assignedUserName != null) res.task.assignedUserName = req.body.assignedUserName;

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
