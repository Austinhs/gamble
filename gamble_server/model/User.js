const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
	username: {
		type    : String,
		required: true
	},
	password: {
		type: String,
		min: 6,
		required: true
	},
	money: {
		type: Number,
		default: 100
	},
	pending_bet: {
		type: Number,
		default: 0
	},
	max_money: {
		type: Number,
		default: 100
	},
	wins: {
		type: Number,
		default: 0
	},
	loses: {
		type: Number,
		default: 0
	},
	profit: {
		type: Number,
		default: 0
	},
	rank: {
		type: Number
	}
});

UserSchema.set('timestamps', true);
UserSchema.options.toJSON = {
	transform: function(doc, ret, options) {
		delete ret.password;
		return ret;
	}
}

module.exports = mongoose.model('User', UserSchema);