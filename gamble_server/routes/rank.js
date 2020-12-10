const router = require('express').Router();
const User   = require('../model/User');

router.get('/all', async (req, res) => {
	try {
		const users = await User.find().sort({ rank: 1 });

		let data = [];
		for(const user of users) {
			data.push({
				rank     : user.rank,
				username : user.username,
				max_money: user.max_money,
				money    : user.money
			});
		}

		res.send(data);
	} catch(e) {
		console.log(e);
		res.status(400).send(e);
	}
});

module.exports = router;