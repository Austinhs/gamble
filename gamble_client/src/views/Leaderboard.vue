<template>
	<v-card class="leaderboard-container">
		<v-card-title>Who has made the most</v-card-title>

		<v-data-table
			:loading="loading"
			:headers="headers"
			:items="items"
			:items-per-page="10"
			class="elevation-1"
		></v-data-table>
	</v-card>
</template>

<script>
	import axios from "axios";

	export default {
		name: "Leaderboard",
		data: () => ({
			loading: true,
			headers: [
				{ text: "Rank", value: "rank" },
				{ text: "Username", value: "username" },
				{ text: "Max", value: "max_money" },
				{ text: "Current", value: "money" },
			],
			items: [],
		}),

		sockets: {
			statUpdate() {
				this.load();
			},
		},

		methods: {
			async load() {
				try {
					const response = await axios.get("rank/all");

					this.items = response.data;
					this.loading = false;
				} catch (e) {
					console.error(e.response);
					window.alert(e.response.data);
				}
			},
		},

		mounted() {
			this.load();
		},
	};
</script>

<style>
	.leaderboard-header {
		text-align: center;
	}
</style>