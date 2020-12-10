const Joi = require('@hapi/joi');

const registerValidation = data => {
	const schema = Joi.object({
		username: Joi.string()
			.required(),
		password: Joi.string()
			.min(6)
			.required(),
		rank: Joi.number()
	});

	return schema.validate(data);
};

const loginValidation = data => {
	const schema = Joi.object({
		username: Joi.string()
			.required(),
		password: Joi.string()
			.min(6)
			.required()
	});

	return schema.validate(data);
};

module.exports = {
	loginValidation: loginValidation,
	registerValidation: registerValidation
}