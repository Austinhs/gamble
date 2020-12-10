<template>
	<v-app>
		<v-navigation-drawer v-model="drawer" app>
			<v-list dense>
				<v-list-item v-for="route in routes" :key="route.path" :to="route.path">
					<v-list-item-action>
						<v-icon>{{route.icon}}</v-icon>
					</v-list-item-action>

					<v-list-item-content>
						<v-list-item-title>{{route.name}}</v-list-item-title>
					</v-list-item-content>
				</v-list-item>
			</v-list>
		</v-navigation-drawer>

		<v-app-bar app color="primary" dark>
			<v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
			<v-toolbar-title>Gambling</v-toolbar-title>

			<v-spacer></v-spacer>

			<v-toolbar-title>Rank: {{rank}}</v-toolbar-title>

			<v-spacer></v-spacer>

			<v-toolbar-title color="green">
				Money:
				<span v-if="money > 0 || pending_bet > 0">${{money}}</span>
				<v-btn v-else color="green" @click="reloadMoney">Give me money again</v-btn>
			</v-toolbar-title>

			<v-spacer></v-spacer>

			<v-toolbar-title>Pending bet: {{pending_bet}}</v-toolbar-title>

			<v-spacer></v-spacer>
			<v-btn @click="logout">Logout of {{username}}</v-btn>
		</v-app-bar>

		<v-main class="main-content">
			<router-view />
		</v-main>
	</v-app>
</template>

<script>
	import axios from "axios";
	import { mapState } from "vuex";

	export default {
		name: "Layout",

		data: () => ({
			drawer: null,
			routes: [],
		}),

		created() {
			this.routes = this.$router.options.routes;
		},

		sockets: {
			async statUpdate() {
				try {
					const user_id = this.user_id;
					const response = await axios.get(`user/${user_id}/stats`);

					this.$store.commit("SET_STATS", {
						...response.data,
					});
				} catch (err) {
					console.error(err.response);
					window.alert(err.response.data);
				}
			},
		},

		computed: {
			...mapState({
				rank: (state) => ordinal_suffix_of(state.rank),
				money: (state) => state.money,
				username: (state) => state.username,
				pending_bet: (state) => "$" + state.pending_bet,
				user_id: (state) => state.id,
				isConnected: (state) =>
					state.socket.connected ? "Connected" : "Disconnected",
			}),
		},

		methods: {
			logout() {
				this.$emit("logout");
			},

			async reloadMoney() {
				try {
					const user_id = this.user_id;
					const response = await axios.post(`user/${user_id}/money_reset`);
					const data = response.data;

					this.$store.commit("SET_MONEY", data.new_money);
					this.$store.commit("SET_PENDING_BET", data.new_pending_bet);
				} catch (err) {
					console.error(err.response);
					window.alert(err.response.data);
				}
			},
		},
	};

	function ordinal_suffix_of(i) {
		var j = i % 10,
			k = i % 100;
		if (j == 1 && k != 11) {
			return i + "st";
		}
		if (j == 2 && k != 12) {
			return i + "nd";
		}
		if (j == 3 && k != 13) {
			return i + "rd";
		}
		return i + "th";
	}
</script>

<style>
	.main-content {
		margin: 15px;
	}
</style>