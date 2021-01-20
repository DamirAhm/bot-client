// @ts-check
const { Roles, Lessons } = require('bot-database');

const CommonResolvers = {
	Mutations: {},
	Queries: {
		//? lessons
		getLessons: {
			name: 'getLessons',
			type: '[String]',
			args: {},
			resolve: async () => {
				return Lessons;
			},
		},
		//? roles
		getRoles: {
			name: 'getRoles',
			type: '[String]',
			args: {},
			resolve: async () => {
				return Object.values(Roles);
			},
		},
	},
};

module.exports = CommonResolvers;
