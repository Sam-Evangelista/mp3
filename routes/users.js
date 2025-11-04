const User = require('../models/user');
const Task = require('../models/task');

async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.fail('Cannot find user', 404);
    }
    res.user = user;
    next();
  } catch (err) {
    if (err && err.name === 'CastError') {
      return res.fail('Invalid ID', 400);
    }
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
        try {
          where = JSON.parse(req.query.where);
        } catch {
          return res.fail('Invalid JSON in "where" query parameter', 400);
        }
      }

      if (req.query.sort) {
        try {
          sort = JSON.parse(req.query.sort);
        } catch {
          return res.fail('Invalid JSON in "sort" query parameter', 400);
        }
      }

      if (req.query.select) {
        try {
          select = JSON.parse(req.query.select);
        } catch {
          return res.fail('Invalid JSON in "select" query parameter', 400);
        }
      }

      const skip = req.query.skip ? parseInt(req.query.skip, 10) : 0;

      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 0;
      const count = req.query.count === 'true';

      if (count) {
        const userCount = await User.countDocuments(where);
        return res.success(userCount);
      }

      let query = User.find(where).sort(sort).select(select).skip(skip);

      if (limit > 0) {
        query = query.limit(limit);
      }

      const users = await query.exec();
      return res.success(users);
    } catch (err) {
      return res.fail('Server error', 500);
    }
  });

  router.post('/', async (req, res) => {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      pendingTasks: req.body.pendingTasks
    });

    if (!user.name || !user.email) {
      return res.fail('Name and email are required', 400);
    }

    try {
      const newUser = await user.save();
      return res.success(newUser, 'Created', 201);
    } catch (err) {
      if (err && err.code === 11000) {
        return res.fail('Email already exists', 409);
      }

      return res.fail('Invalid user data', 400);
    }
  });

  router.get('/:id', async (req, res) => {
    let select = {};
    if (req.query.select) {
      try {
        select = JSON.parse(req.query.select);
      } catch {
        return res.fail('Invalid JSON in "select" query parameter', 400);
      }
    }
  
    try {
      const user = await User.findById(req.params.id).select(select).exec();
      if (!user) {
        return res.fail('Cannot find user', 404);
      }
      return res.success(user);
    } catch (err) {
      if (err.name === 'CastError') {
        return res.fail('Invalid ID', 400);
      }
      return res.fail('Server error', 500);
    }
  });

  router.put('/:id', getUser, async (req, res) => {
    try {
      if (req.body.name != null)  res.user.name  = req.body.name;
      if (req.body.email != null) res.user.email = req.body.email;

      if (Array.isArray(req.body.pendingTasks)) {
        const desired = req.body.pendingTasks.map(String);
        const userIdStr = String(res.user._id);

        const currentTaskIds = (await Task.find({ assignedUser: userIdStr }).select('_id').exec())
          .map(t => String(t._id));

        const toAdd = desired.filter(id => !currentTaskIds.includes(id));
        const toRemove = currentTaskIds.filter(id => !desired.includes(id));

        if (toAdd.length) {
          await Task.updateMany(
            { _id: { $in: toAdd } },
            { $set: { assignedUser: userIdStr, assignedUserName: res.user.name } }
          );
        }

        if (toRemove.length) {
          await Task.updateMany(
            { _id: { $in: toRemove }, assignedUser: userIdStr },
            { $set: { assignedUser: '', assignedUserName: 'unassigned' } }
          );
        }
        res.user.pendingTasks = desired;
      }

      const updated = await res.user.save();
      return res.success(updated);
    } catch (err) {
      if (err && err.code === 11000) return res.fail('Email already in use', 409);
      if (err && err.name === 'CastError') return res.fail('Invalid ID', 400);
      return res.fail('Invalid user update', 400);
    }
  });

  router.delete('/:id', getUser, async (req, res) => {
    try {
      const userId = res.user._id.toString();
     
      await Task.updateMany(
        { assignedUser: userId },
        { $set: { assignedUser: '', assignedUserName: 'unassigned' } }
      );

      await res.user.deleteOne();
      return res.success(null, 'Deleted');
    } catch (err) {
      return res.fail('Server error', 500);
    }
  });

  return router;
};
