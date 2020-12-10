<template>
	<div class="duel-container">
		<div class="duel-tools">
			<v-form @submit.prevent="createDuel()">
				<v-text-field v-model="bet_amount" type="number" width="100px" prepend-icon="mdi-currency-usd"></v-text-field>
				<v-btn dark type="submit">Create Duel</v-btn>
			</v-form>
		</div>

		<br />
		<v-divider />

		<div class="duels-list" v-if="!loading">
			<v-simple-table class="duels" v-if="duels.length > 0" :fixed-header="true">
				<template v-slot:default>
					<thead>
						<th>User</th>
						<th>Bet amount</th>
						<th>Game played @</th>
						<th>Winner/Join</th>
					</thead>
					<tbody>
						<tr v-for="duel in duels" :key="duel._id" class="duel-item">
							<td>{{duel.started_by_username}}</td>
							<td>${{getDuelStartSum(duel)}}</td>
							<td>{{ moment(duel.createdAt).format('MM/DD/YYYY LT') }}</td>
							<td>
								<span v-if="duel.counter > 0">{{duel.counter}}</span>
								<span v-else>
									<v-btn
										color="primary"
										v-if="duel.pending && duel.started_by_username != username"
										:loading="loading_ids.includes(duel._id)"
										small
										@click="joinDuel(duel._id)"
									>Join Duel</v-btn>

									<v-btn
										v-if="duel.pending && duel.started_by_username == username"
										color="red"
										dark
										small
										@click="removeDuel(duel._id)"
									>Remove</v-btn>

									<h3 v-if="!duel.pending">{{duel.winner}}: ${{getDuelSum(duel)}}</h3>
								</span>
							</td>
						</tr>
					</tbody>
				</template>
			</v-simple-table>

			<div class="duels error" v-else>
				<v-alert color="red lighten-1" icon="mdi-account-supervisor-circle" dark>No duels found</v-alert>
			</div>
		</div>

		<div class="loading-duels" v-else>
			<v-progress-circular size="200" width="10" indeterminate />
		</div>
	</div>
</template>

<script>
	import axios from "axios";
	import moment from "moment";
	import { mapState } from "vuex";

	export default {
		name: "Duels",

		data: () => ({
			duels: [],
			bet_amount: 0,
			loading: true,
			loading_ids: [],
			duels_counter: {},
		}),

		computed: {
			...mapState({
				user_id: (state) => state.id,
				username: (state) => state.username,
			}),
		},

		mounted() {
			axios
				.get("gamble/games/duel")
				.then((response) => {
					this.loading = false;
					this.duels = response.data;
				})
				.catch(function (err) {
					console.error(err);
					window.alert(err.response.data);
				});
		},

		sockets: {
			connect_duel(connected) {
				console.log("duels connected", connected);
			},

			duel_start(data) {
				this.loading_ids = this.loading_ids.filter((id) => id != data.id);
			},

			duel_timer(data) {
				let duel = this.duels.find((duel) => duel._id == data.id);

				if (duel) {
					this.$set(duel, "counter", data.count);
				}
			},

			duel_removed(data) {
				this.duels = this.duels.filter((duel) => {
					return duel._id != data.id;
				});
			},

			duel_created(data) {
				this.duels.unshift(data.game);

				this.duels.sort(function (a, b) {
					if (a.pending && b.pending) {
						if (a.bet_min < b.bet_min) {
							return 1;
						} else if (a.bet_min > b.bet_min) {
							return -1;
						}
					} else if (!a.pending && b.pending) {
						return 1;
					} else if (a.pending && !b.pending) {
						return -1;
					} else if (!a.pending && !b.pending) {
						if (a.bet_min < b.bet_min) {
							return 1;
						} else if (a.bet_min > b.bet_min) {
							return -1;
						}
					}
				});
			},

			duel_winner(data) {
				let duel = this.duels.find((duel) => duel._id == data.id);

				if (duel) {
					this.$set(duel, "counter", null);
					this.$set(duel, "pending", false);
					this.$set(duel, "winner", data.winner);
				}
			},
		},

		methods: {
			createDuel() {
				axios
					.post("gamble/games/duel", {
						amount: this.bet_amount,
						id: this.user_id,
						username: this.username,
					})
					.then((response) => {
						this.$store.commit("SET_PENDING_BET", response.data.new_pending_bet);
						this.$store.commit("SET_MONEY", response.data.new_money);
					})
					.catch((err) => {
						console.error(err);
						window.alert(err.response.data);
					});
			},

			moment(date) {
				return moment(date);
			},

			joinDuel(id) {
				let bet_min = 0;
				for (const duel of this.duels) {
					if (duel._id == id) {
						bet_min = duel.bet_min;
						break;
					}
				}

				this.loading_ids.push(id);

				axios
					.post("gamble/games/join/" + id, {
						amount: bet_min,
					})
					.then((response) => {
						this.loading_ids = this.loading_ids.filter((id) => id != id);
						this.$store.commit("SET_PENDING_BET", response.data.new_pending_bet);
						this.$store.commit("SET_MONEY", response.data.new_money);
					})
					.catch(function (err) {
						console.error(err);
						window.alert(err.response.data);
					});
			},

			removeDuel(id) {
				axios
					.post("gamble/games/remove/" + id)
					.then((response) => {
						this.$store.commit("SET_PENDING_BET", response.data.new_pending_bet);
						this.$store.commit("SET_MONEY", response.data.new_money);
					})
					.catch(function (err) {
						console.error(err);
						window.alert(err.response.data);
					});
			},

			getDuelStartSum(duel) {
				let sum = 0;
				if (duel && duel.bets) {
					for (const bet of duel.bets) {
						if (duel.started_by_username == bet.username) {
							sum += Number(bet.amount);
						}
					}
				}

				return sum;
			},

			getDuelSum(duel) {
				let sum = 0;

				if (duel && duel.bets) {
					for (const bet of duel.bets) {
						sum += Number(bet.amount);
					}
				}

				return sum;
			},
		},
	};
</script>

<style>
	.duel-tools {
		width: 20%;
		text-align: center;
	}

	.duels.error,
	.duels-list {
		margin-top: 2em;
	}

	.loading-duels {
		margin-top: 2em;
		text-align: center;
		width: 100%;
	}

	.duels {
	}

	.duel-item {
		text-align: center;
	}
</style>