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
      const users = await User.find();
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

  router.get('/:id', getUser, (req, res) => {
    return res.success(res.user);
  });

  router.put('/:id', getUser, async (req, res) => {
    // apply updates safely
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
      await res.user.deleteOne(); // remove() deprecated
      return res.success(null, 'Deleted');
    } catch (err) {
      return res.fail(err.message, 500);
    }
  });

  return router;
};
