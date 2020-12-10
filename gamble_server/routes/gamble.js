const router = require('express').Router();
const Gamble = require('../model/Gamble');
const User   = require('../model/User');
const verify = require('./verifyToken');

router.get('/games/:type', async (req, res) => {
	try {
		const games = await Gamble.find().sort({ pending: -1, bet_min: -1 });

		req.io.sockets.emit('connect_duel', true);

		res.send(games);
	} catch(err) {
		console.log(err);
		res.status(400).send(err);
	}
});

router.post('/games/join/:id', verify, async(req, res) => {
	try {
		req.io.sockets.emit('duel_join', {
			id: req.params.id
		});

		const gamble = await Gamble.findOne({ _id: req.params.id });

		if(gamble.type == 'duel') {
			if(gamble.bets.length >= 2) {
				return res.status(400).send("Someone has already joined this duel.");
			}

			req.amount = gamble.bet_min;
		}

		if(gamble.bet_min > req.amount) {
			return res.status(400).send("The amount bet does not meet the minimum requirement.");
		}

		const current_user    = await User.findOne({ _id: req.user._id });
		const available_money = Number(current_user.money) - Number(current_user.pending_bet);

		if(available_money < gamble.bet_min) {
			return res.status(400).send("You do not have enough money to join this duel.");
		}

		req.amount = isNaN(Number(req.amount)) ? 0 : Number(req.amount);

		current_user.money       -= req.amount;
		current_user.pending_bet += req.amount;

		gamble.bets.push({
			user_id : current_user._id,
			amount  : req.amount,
			username: current_user.username
		});

		await gamble.save();
		await current_user.save();

		res.send({
			new_pending_bet: current_user.pending_bet,
			new_money      : current_user.money
		});

		if(gamble.type == 'duel' && gamble.bets.length >= 2) {
			startGame(req.params.id, req);
		}
	} catch(err) {
		res.status(400).send(err);
	}
});

router.post('/games/remove/:id', verify, async(req, res) => {
	try {
		const gamble = await Gamble.findOne({ _id: req.params.id, pending: true });
		if(!gamble) return res.status(400).send("Game does not exist, therefor we cannot delete it");
		if(gamble.started_by_username != req.user.username) return res.status(400).send("You cannot delete a game that is not yours");

		for(const bet of gamble.bets) {
			const user = await User.findOne({ _id: bet.user_id });

			bet.amount = bet.amount ? bet.amount : 0;

			user.pending_bet -= Number(bet.amount);
			user.money       += Number(bet.amount);

			await user.save();
		}

		await gamble.remove();

		req.io.sockets.emit('duel_removed', {
			id: req.params.id
		});

		const current_user = await User.findOne({ _id: req.user._id });
		res.send({ new_pending_bet: current_user.pending_bet, new_money: current_user.money });
	} catch(err) {
		console.log(err);
		res.status(400).send(err);
	}
});

router.post('/games/:type', verify, async(req, res) => {
	try {
		const user = await User.findOne({ _id: req.body.id });
		if(!user) return res.status(400).send("User creating the bet, does not exist");

		const available_money = user.money - user.pending_bet;
		if(available_money < Number(req.body.amount)) return res.status(400).send("You cannot bet more money then you have");

		req.body.amount = isNaN(Number(req.body.amount)) ? 0 : Number(req.body.amount);

		if(req.body.amount <= 0) {
			return res.status(400).send("You cannot bet less than $1");
		}

		let bet_min = 0;
		if(req.params.type == "duel") {
			bet_min = req.body.amount
		}

		const game = new Gamble({
			type: req.params.type,
			bets: [
				{
					user_id : req.body.id,
					amount  : req.body.amount,
					username: req.body.username,
				}
			],
			bet_min : bet_min,
			pending: true,
			started_by_username: req.body.username
		});

		user.pending_bet += req.body.amount;
		user.money       -= req.body.amount;

		await user.save();
		await game.save();

		req.io.sockets.emit('duel_created', {game: game.toJSON()});
		res.send({ new_pending_bet: user.pending_bet, new_money: user.money })
	} catch(err) {
		res.status(400).send(err);
	}
});

function sumBets(gamble) {
	let sum = 0;
	for(const bet of gamble.bets) {
		sum += bet.amount;
	}
	return sum;
}

async function startGame(id, req) {
	const gamble = await Gamble.findById(id);

	if(gamble.type == 'duel') {
		runDuel(gamble, req);
	}
}

async function runDuel(gamble, req) {
	if(gamble.bets.length < 2) {
		console.log('Not enough bets exist to runDuel');
		return;
	}

	const winning_amount = sumBets(gamble);

	// Run game logic
	let roll = getRandomInt(1, 100);
	while(roll == 50) {
		roll = getRandomInt(1, 100);
	}

	const player_1_roll  = roll < 50;
	const player_2_roll  = roll > 50;
	const player_1       = await User.findById(gamble.bets[0].user_id);
	const player_2       = await User.findById(gamble.bets[1].user_id);

	gamble.bets[0].win = player_1_roll;
	gamble.bets[1].win = player_2_roll;
	gamble.roll = roll;


	player_1.pending_bet -= gamble.bets[0].amount;
	player_2.pending_bet -= gamble.bets[1].amount;

	let winner = '';
	if(player_1_roll) {
		player_1.money += winning_amount;
		winner = player_1.username;
	} else {
		player_2.money += winning_amount;
		winner = player_2.username;
	}

	gamble.winner  = winner;
	gamble.pending = false;

	await player_1.save();
	await player_2.save();
	await gamble.save();

	req.io.sockets.emit('duel_start', {
		id: gamble._id
	});

	let counter = 5;
	let timer = setInterval(async () => {
		req.io.sockets.emit('duel_timer', {
			id   : gamble._id,
			count: counter
		});

		counter--;

		if(counter < 0) {
			clearInterval(timer);
			await updateUserStats(req);
			req.io.sockets.emit('duel_winner', {
				id    : gamble._id,
				winner: gamble.winner
			});
		}
	}, 1000);
}

async function updateUserStats(req) {
	try {
		let users = await User.find().sort();

		for(const user of users) {
			if(user.max_money < user.money) {
				user.max_money = user.money;
			}
		}

		users.sort(function(a, b) {
			if(a.max_money > b.max_money) {
				return -1;
			} else {
				return 1;
			}
		});

		let rank = 1;
		for(const user of users) {
			user.rank = rank;
			await user.save();

			rank++;
		}

		req.io.sockets.emit('statUpdate');
	} catch(err) {
		console.log('error updateUserStats', err);
	}
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

module.exports = router;