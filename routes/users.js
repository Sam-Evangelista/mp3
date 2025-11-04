const User = require('../models/user');

async function getUser(req, res, next) {
  try {
    user = await User.findById(req.params.id);
    if (user == null) {
      return res.status(404).json({message: 'Cannot find user'});
    }
  } catch (err) {
    return res.status(500).json({message: err.message});
  }

  res.user = user;
  next();
}


module.exports = function (router) {
  router.get('/', async (req, res) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }

  })

  router.post('/', async (req, res) => {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      pendingTasks: req.body.pendingTasks
    });

    try {
      const newUser = await user.save();
      res.status(201).json(newUser);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  })
  
  router.get('/:id', getUser, (req, res) => {
    res.json(res.user);
  }); 

  router.put('/:id', getUser, async(req, res) => {
    if (req.body.name != null) {
      res.user.name = req.body.name;
    }
    if (req.body.email != null) {
      res.user.email = req.body.email;
    }
    if (req.body.pendingTasks != null) {
      res.user.pendingTasks = req.body.pendingTasks;
    }

    try {
      const updatedUser = await res.user.save();
      return res.json(updatedUser);
    } catch(err) {
      return res.status(400).json({ message: err.message });
    }
    
  });

  router.delete('/:id', getUser, async (req, res) => {
    try {
      await res.user.remove();
      res.json({ message: 'Deleted User' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
};