const User = require('../models/user');

async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.fail('Cannot find user', 404);
    }
    res.user = user;
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
      return res.fail(err.message, 500);
    }
  });

  router.post('/', async (req, res) => {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      pendingTasks: req.body.pendingTasks
    });

    try {
      const newUser = await user.save();
      return res.success(newUser, 'Created', 201);
    } catch (err) {
      return res.fail(err.message, 400);
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
      // NOTE: call .exec() with parentheses
      const user = await User.findById(req.params.id).select(select).exec();
      if (!user) {
        return res.fail('Cannot find user', 404);
      }
      return res.success(user); // ← send the response
    } catch (err) {
      // Optional: nicer invalid ObjectId handling
      if (err.name === 'CastError') {
        return res.fail('Invalid ID', 400);
      }
      return res.fail(err.message, 500);
    }
  });

  router.put('/:id', getUser, async (req, res) => {
    if (req.body.name != null) res.user.name = req.body.name;
    if (req.body.email != null) res.user.email = req.body.email;
    if (req.body.pendingTasks != null) res.user.pendingTasks = req.body.pendingTasks;

    try {
      const updatedUser = await res.user.save();
      return res.success(updatedUser);
    } catch (err) {
      return res.fail(err.message, 400);
    }
  });

  router.delete('/:id', getUser, async (req, res) => {
    try {
      await res.user.deleteOne();
      return res.success(null, 'Deleted');
    } catch (err) {
      return res.fail(err.message, 500);
    }
  });

  return router;
};
