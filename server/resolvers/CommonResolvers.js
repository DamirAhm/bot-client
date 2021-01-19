// @ts-check
const { Roles, Lessons } = require('bot-database');

const CommonResolvers = {
	Mutations: {},
	Queries: {
		//? lessons
		lessons: {
			name: 'lessons',
			type: '[String]',
			args: {},
			resolve: async () => {
				return Lessons;
			},
		},
		//? roles
		roles: {
			name: 'roles',
			type: '[String]',
			args: {},
			resolve: async () => {
				return Object.values(Roles);
			},
		},
	},
};

module.exports = CommonResolvers;
