<template>
	<v-app>
		<Layout v-if="login" @logout="handleLogout()" />
		<Login v-else @login="handleLogin()" />
	</v-app>
</template>

<script>
	import Layout from "./components/Layout";
	import Login from "./components/Login";
	import axios from "axios";
	import jwt from "jsonwebtoken";

	export default {
		components: {
			Layout,
			Login,
		},

		props: {
			source: String,
		},

		async created() {
			const token = localStorage.getItem("token");

			if (token) {
				const data = jwt.decode(token);

				try {
					axios.defaults.headers = {
						"auth-token": token,
					};

					const response = await axios.get("user/" + data._id);

					this.$store.commit("SET_LOGGED_IN", {
						...response.data,
						token: token,
					});

					this.login = true;
				} catch (err) {
					if (err.response.data == "Access Denied") {
						this.login = false;
					} else {
						console.error(err);
						window.alert(err);
					}
				}
			}
		},

		data: () => ({
			drawer: null,
			login: false,
		}),

		methods: {
			handleLogout() {
				this.login = false;
			},

			handleLogin() {
				this.login = true;
			},
		},
	};
</script>