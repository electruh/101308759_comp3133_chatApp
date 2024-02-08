const mongoose = require('mongoose');

const grp_messageSchema = mongoose.Schema({
    
    from_user:{
        type:String, 
        required:true
    },
    room:{
        type:String,
        required:true
    },
    message:{
        type:String, 
        required:true
    },
    date_sent:{
        type:Date , 
        default: Date.now,
        required:true
    }
})

module.exports = mongoose.model('GroupChat',grp_messageSchema)