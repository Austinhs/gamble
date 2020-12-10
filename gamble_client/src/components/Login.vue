<template>
	<v-app id="inspire">
		<v-main>
			<v-container class="fill-height" fluid>
				<v-row align="center" justify="center">
					<v-col cols="12" sm="8" md="4">
						<v-card class="elevation-12">
							<v-toolbar color="primary" dark flat>
								<v-toolbar-title>Login form</v-toolbar-title>
							</v-toolbar>
							<v-card-text>
								<v-alert v-if="error" color="red lighten-1" icon="mdi-account" dark>{{error}}</v-alert>

								<v-form @submit.prevent="login()">
									<v-text-field
										v-model="username"
										label="Username"
										name="username"
										prepend-icon="mdi-account"
										type="text"
									></v-text-field>

									<v-text-field
										id="password"
										v-model="password"
										label="Password"
										name="password"
										prepend-icon="mdi-lock"
										type="password"
									></v-text-field>

									<v-card-actions>
										<v-spacer></v-spacer>
										<v-btn color="secondary" dark @click="register">Register</v-btn>
										<v-btn color="primary" dark type="submit">Login</v-btn>
									</v-card-actions>
								</v-form>
							</v-card-text>
						</v-card>
					</v-col>
				</v-row>
			</v-container>
		</v-main>
	</v-app>
</template>

<script>
	import axios from "axios";

	export default {
		data: () => ({
			error: "",
			username: "",
			password: "",
		}),

		name: "Login",

		props: {
			source: String,
		},

		methods: {
			async login() {
				axios
					.post("user/login", {
						username: this.username,
						password: this.password,
					})
					.then((response) => {
						const data = response.data;

						this.$store.commit("SET_LOGGED_IN", { ...data });

						this.$emit("login");
					})
					.catch((e) => (this.error = e.response.data));
			},

			async register() {
				axios
					.post("user/register", {
						username: this.username,
						password: this.password,
					})
					.then(() => {
						window.alert("Your account has been created!");

						this.login();
					})
					.catch((e) => (this.error = e.response.data));
			},
		},
	};
</script>