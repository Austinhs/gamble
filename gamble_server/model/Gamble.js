const mongoose = require('mongoose');

const GambleSchema = new mongoose.Schema({
	type: {
		type: String,
		required: true
	},
	bets: {
		type: Array,
		required: true
	},
	started_by_username: {
		type: String,
		required: true
	},
	winner: {
		type: String
	},
	bet_min: {
		type: Number,
		default: 0
	},
	roll: {
		type: Number
	},
	pending: {
		type: Boolean,
		default: true
	}
});

GambleSchema.set('timestamps', true);

module.exports = mongoose.model('Gamble', GambleSchema);