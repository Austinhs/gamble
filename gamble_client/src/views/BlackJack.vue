<template>
	<v-app class="black-jack-container">
		<div class="dealer-container"></div>
		<div class="players-container">
			<div
				class="player-seat"
				:class="{ empty: players[i].name == null }"
				@click="join(i)"
				v-for="i in 6"
				:key="i"
			>
				<div class="player-name">{{players[i].name}}</div>
				<div class="player-cards">{{players[i].cards}}</div>
			</div>
		</div>
		<div class="extra-container">
			<v-btn color="primary" dark>Watch</v-btn>
			<v-btn color="secondary" dark>Queue</v-btn>
		</div>
		<div class="watcher-container">
			<div class="queue-list watcher-list"></div>
			<div class="watch-list watcher-list"></div>
		</div>
	</v-app>
</template>

<script>
	import { mapState } from "vuex";
	//import axios from "axios";

	export default {
		name: "BlackJack",
		data: () => ({
			players: {
				1: { name: null, cards: null },
				2: { name: null, cards: null },
				3: { name: null, cards: null },
				4: { name: null, cards: null },
				5: { name: null, cards: null },
				6: { name: null, cards: null },
			},
		}),

		computed: {
			...mapState({
				username: (state) => state.username,
			}),
		},

		methods: {
			join(seat_number) {
				for (let player_index in this.players) {
					const player_username = this.players[player_index].name;

					if (player_username == this.username) {
						this.players[player_index].name = null;
					}
				}

				this.players[seat_number].name = this.username;
			},
		},
	};
</script>

<style>
	.extra-container {
		bottom: 0;
		display: flex;
		margin-top: 5em;
		justify-content: space-around;
	}

	.watcher-container {
		display: flex;
		justify-content: space-between;
		flex-grow: 1;
	}

	.watcher-list {
		background: #ddd;
		margin: 2em 2em;
		flex-grow: 1;
		border: 1px solid black;
	}

	.dealer-container {
		background: green;
		border-bottom-left-radius: 50%;
		border-bottom-right-radius: 50%;
		height: 250px;
	}

	.players-container {
		margin-top: 2em;
		display: flex;
		justify-content: space-around;
	}

	.player-name {
		font-size: 1.2em;
		font-weight: bolder;
		text-align: center;
		letter-spacing: 5px;
		max-width: 200px;
		text-decoration: underline;
	}

	.player-seat.empty {
		background: black;
		height: 100px;
		width: 100px;
		border-radius: 50%;
	}

	.player-seat.empty::before {
		content: "Join";
		font-size: 2em;
		text-align: center;
		display: block;
		align-self: center;
		margin-top: 22%;
		color: white;
	}

	.player-seat.empty:hover {
		cursor: pointer;
		box-shadow: black 1px 0px 5px 5px;
	}
</style>