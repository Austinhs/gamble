const router                                = require('express').Router();
const {registerValidation, loginValidation} = require('../model/validation/Auth');
const bcrypt                                = require('bcryptjs');
const jwt                                   = require('jsonwebtoken');
const User                                  = require('../model/User');
const verify                                = require('./verifyToken');

const rank_chain = [
	"User",
	"Support",
	"Admin",
	"Super"
];

router.post('/register', async (req, res) => {
	// Validate
	const { error } = registerValidation(req.body);
	if (error) return res.status(400).send(error.details[0].message);

	// Hash Password
	const salt     = await bcrypt.genSalt(10);
	const hashPass = await bcrypt.hash(req.body.password, salt);

	try {
		const exists = await User.findOne({ username: String(req.body.username).toLowerCase() });
		if(exists) return res.status(400).send("Username already exists");

		const rank = await User.count() + 1;

		const user = new User({
			username: req.body.username,
			password: hashPass,
			rank: rank
		});

		const savedUser = await user.save();

		return res.send({ user: savedUser });
	} catch(err) {
		return res.status(400).send(err);
	}
});

router.post('/:id/money_reset', verify, async (req, res) => {
	if(req.user._id != req.params.id) {
		return res.status(400).send("You cannot reset money for a different account than what you are logged in as.");
	}

	try {
		const user = await User.findById(req.params.id);

		if(user.money > 0 || user.pending_bet > 0) {
			return res.status(400).send("You do not have less than $0");
		}

		user.money       = 100;
		user.pending_bet = 0;
		await user.save();

		return res.send({
			new_money      : 100,
			new_pending_bet: 0
		});
	} catch(err) {
		return res.status(400).send(err);
	}
});

router.post('/login', async (req, res) => {
	const incorrect_msg = 'Username or Password is incorrect';

	// Validate
	const { error } = loginValidation(req.body);
	if (error) return res.status(400).send(error.details[0].message);

	// Check if username exists
	let user = await User.findOne({ username: String(req.body.username).toLowerCase() });
	if(!user) return res.status(400).send(incorrect_msg);

	// Password is correct
	const validPass = await bcrypt.compare(req.body.password, user.password);
	if(!validPass) return res.status(400).send(incorrect_msg);

	// Create and assign a jwt token
	const token = jwt.sign(user.toJSON(), process.env.TOKEN_SECRET);

	user = user.toJSON();
	user.token = token;

	return res.header('auth-token', token).send(user);
});

router.get('/:id', verify, async (req, res) => {
	if(req.user.role == "User") {
		return res.status(401).send('Access Denied');
	}

	try {
		const user = await User.findById(req.params.id);
		return res.send(user.toJSON());
	} catch(err) {
		return res.status(400).send(err);
	}
});

router.get('/:id/stats', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		if(!user) return res.status(400).send("Could not find user_id: " + req.params.id);

		return res.send({
			rank       : user.rank,
			money      : user.money,
			pending_bet: user.pending_bet
		});
	} catch(err) {
		return res.status(400).send(err);
	}
})

router.put('/:id', verify, async (req, res) => {
	if(req.user.role == "User" && req.params.id != req.user._id) {
		return res.status(401).send('Access Denied');
	}

	try {
		const user = await User.findById(req.params.id);
		if(!user) return res.status(400).send('Could not find user');

		// Hash Password
		let hashPass = user.password;
		if(req.body.password) {
			const salt     = await bcrypt.genSalt(10);

			hashPass = await bcrypt.hash(req.body.password, salt);
		}

		user.username = req.body.username ? req.body.username : user.username;
		user.password = hashPass;
		user.rank     = req.body.rank ? req.body.rank : user.rank;

		await user.save();

		return res.send(user.toJSON());
	} catch(err) {
		return res.status(400).send(err);
	}
});

router.delete('/:id', verify, async (req, res) => {
	if(req.user.role == "User" && req.params.id != req.user._id) {
		return res.status(401).send('Access Denied');
	}

	try {
		await User.findByIdAndDelete(req.params.id);
		return res.send('User has been deleted');
	} catch(err) {
		return res.status(400).send(err);
	}
});

router.post('/promote/:id', verify, async (req, res) => {
	if(!['Admin', 'Super'].includes(req.user.role)) {
		return res.status(401).send('Access Denied');
	}

	if(req.params.id == req.user._id) {
		return res.status(401).send('Access Denied -- You cannot promote your self');
	}

	try {
		const user = await User.findOne({ _id: req.params.id });
		if(!user) return res.status(400).send('Could not find user to promote');
		if(user.role == "Super") return res.status(400).send("Can not promote someone passed Super");

		// Promote
		let rank = rank_chain.findIndex(el => el == user.role);
		rank++;
		user.role = rank_chain[rank];

		const current_user_rank = rank_chain.findIndex(el => el == req.user.role);
		if(rank >= current_user_rank) {
			return res.status(401).send('Access Denied -- You cannot promote someone above OR to the same rank as you');
		}

		await user.save();

		return res.send(`Promoted ${user.first_name} ${user.last_name} to ${user.role}`);
	} catch(err) {
		return res.status(400).send(err);
	}
});

router.get('/role/:role_type', verify, async (req, res) => {
	if(req.user.role == "User") {
		return res.status(401).send('Access Denied');
	}

	const role = req.params.role_type == 'all'
		? 'all'
		: req.params.role_type.charAt(0).toUpperCase() + req.params.role_type.slice(1);

	try {
		const lookup = role == 'all' ? {} : { role: role };
		const users  = await User.find(lookup);

		let return_val = [];
		for(const user of users) {
			return_val.push(user.toJSON());
		}

		res.send(return_val);
	} catch(err) {
		res.status(400).send(err);
	}
})

router.post('/demote/:id', verify, async (req, res) => {
	if(!['Admin', 'Super'].includes(req.user.role)) {
		return res.status(401).send('Access Denied');
	}

	try  {
		const user = await User.findOne({ _id: req.params.id });
		if(!user) return res.status(400).send('Could not find user to promote');
		if(user.role == "User") return res.status(400).send('Can not demote someone past "User"');

		// Demote
		let rank = rank_chain.findIndex(el => el == user.role);

		const current_user_rank = rank_chain.findIndex(el => el == req.user.role);
		if(rank >= current_user_rank) {
			return res.status(401).send('Access Denied -- You cannot demote someone above OR to the same rank as you');
		}

		rank--;
		user.role = rank_chain[rank];
		user.save();

		res.send(`Demoted ${user.first_name} ${user.last_name} to ${user.role}`);
	} catch(err) {
		res.status(400).send(err);
	}
});

module.exports = router;