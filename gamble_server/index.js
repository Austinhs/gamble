const express  = require('express');
const app      = express();
const mongoose = require('mongoose');
const cors     = require('cors');
const dotenv   = require('dotenv');
const http     = require('http').createServer(app);
const io       = require('socket.io')(http);

dotenv.config();

const port = 3000;

app.use(cors());

// Connect DB
console.log('Connecting to DB with ', process.env.DB_CONNECT);
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
	console.log('Connected to Atlas Mongo DB');

	// Inject Socket
	app.use(function(req, res, next) {
		req.io = io;
		next();
	});

	// Import routes
	const userRoutes   = require('./routes/user');
	const rankRoutes   = require('./routes/rank');
	const gambleRoutes = require('./routes/gamble');

	// Middleware
	app.use(express.json());

	// Route Middleware
	app.use('/api/user', userRoutes);
	app.use('/api/rank', rankRoutes);
	app.use('/api/gamble', gambleRoutes);


	http.listen(port, () => console.log(`Server up and running on http://localhost:${port}`));
}).catch(function(err) {
	console.log('Error connecting to Atlas Mongo DB: ', err);
});

