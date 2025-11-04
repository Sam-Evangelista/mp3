var mongoose = require('mongoose');

var taskSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true 
    },
    description: {
        type: String,
        required: true,
        trim: true,
        default: ""
    },
    deadline: {
        type: Date,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    assignedUser: {
        type: String,
        default: ""
    },
    assignedUserName: {
        type:String,
        default: "unassigned"
    },
    dateCreated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);
