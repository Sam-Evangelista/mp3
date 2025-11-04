module.exports = (req, res, next) => {
    res.success = (data, message = 'OK', status = 200) => {
      return res.status(status).json({ message, data });
    };
  
    res.fail = (message = 'Bad Request', status = 400, data = null) => {
      return res.status(status).json({ message, data });
    };
  
    next();
};
  