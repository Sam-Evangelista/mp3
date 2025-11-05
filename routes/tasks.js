const Task = require('../models/task');
const User = require('../models/user');

async function getTask(req, res, next) {
    try {
        const task = await Task.findById(req.params.id);
        if (task == null) {
            return res.fail('Cannot find task', 404);
        }
        res.task = task;
        next();
    } catch (err) {
        if (err && err.name === 'CastError') {
            return res.fail('Invalid ID', 400);
        }
        return res.fail('Server error', 500);
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

            const tasks = await Task.find(where).select(select).sort(sort).skip(skip).limit(limit).exec();

            return res.success(tasks);
        } catch (err) {
            return res.fail('Server error', 500);
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

        if (!task.name || !task.deadline) {
            return res.fail('Name and deadline are required', 400);
        }

        try {
            const newTask = await task.save();
            return res.success(newTask, 'Created', 201);
        } catch (err) {
            return res.fail('Invalid task data', 400);
        }
    });

    router.get('/:id', async (req, res) => {
        let select = {};
        if (req.query.select) {
            try { 
                select = JSON.parse(req.query.select); 
            }
            catch { 
                return res.fail('Invalid JSON in select parameter', 400); 
            }
        }
        try {
            const task = await Task.findById(req.params.id).select(select).exec();
            if (!task) {
                return res.fail('Cannot find task', 404);
            }
            return res.success(task);
        } catch (err) {
            return res.fail('Invalid ID', 400);
        }
    });

    router.put('/:id', getTask, async (req, res) => {
        const oldUserId = res.task.assignedUser || '';
        const taskIdStr = String(res.task._id);

        if (req.body.name != null)        res.task.name = req.body.name;
        if (req.body.description != null) res.task.description = req.body.description;
        if (req.body.deadline != null)    res.task.deadline = req.body.deadline;
        if (req.body.completed != null)   res.task.completed = req.body.completed;

        try {
        if ('assignedUser' in req.body) {
            const newUserId = req.body.assignedUser ? String(req.body.assignedUser) : '';

            if (newUserId && newUserId !== oldUserId) {
            const newUser = await User.findById(newUserId).exec();
            if (!newUser) return res.fail('Assigned user not found', 400);

            if (oldUserId) {
                await User.findByIdAndUpdate(oldUserId, { $pull: { pendingTasks: taskIdStr } });
            }
            await User.findByIdAndUpdate(newUserId, { $addToSet: { pendingTasks: taskIdStr } });

            res.task.assignedUser = newUserId;
            res.task.assignedUserName = newUser.name;

            } else if (!newUserId && oldUserId) {
            await User.findByIdAndUpdate(oldUserId, { $pull: { pendingTasks: taskIdStr } });
            res.task.assignedUser = '';
            res.task.assignedUserName = 'unassigned';
            }
        }

        const updated = await res.task.save();
        return res.success(updated);
        } catch (err) {
        if (err && err.name === 'CastError') return res.fail('Invalid assigned user', 400);
        return res.fail('Invalid task update', 400);
        }
    });

    router.delete('/:id', getTask, async (req, res) => {
        try {
            const taskId = res.task._id.toString();
            const userId = res.task.assignedUser;

            if (userId) {
                await User.findByIdAndUpdate(userId, { $pull: { pendingTasks: taskId } });
            }
            
            await res.task.deleteOne();
            return res.success(null, 'Deleted');
        } catch (err) {
            return res.fail('Server error', 500);
        }
    });

    return router;
}
