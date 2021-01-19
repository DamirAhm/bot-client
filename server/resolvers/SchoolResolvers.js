// @ts-check
const { DataBase: DB } = require('bot-database');
const { ClassTC } = require('../ModelTypeComposers');

const DataBase = new DB(process.env.MONGODB_URI);

const SchoolsResolvers = {
	Mutations: {
		//* Ovreride
		//? create
		schoolCreateOne: {
			name: 'schoolCreateOne',
			type: ClassTC.getType(),
			args: { schoolName: 'String!' },
			resolve: async ({ args: { schoolName } }) => {
				if (/^[a-z]*:\d*$/i.test(schoolName)) {
					return (await DataBase.createSchool(schoolName)).toJSON({ virtuals: true });
				} else {
					return null;
				}
			},
		},
	},
	Queries: {},
};

module.exports = SchoolsResolvers;
