// @ts-check
const { DataBase: DB } = require('bot-database');
const { SchoolTC } = require('../ModelTypeComposers');

const DataBase = new DB(process.env.MONGODB_URI);

const SchoolsResolvers = {
	Mutations: {
		//* Ovreride
		//? create
		schoolCreateOne: {
			name: 'schoolCreateOne',
			type: SchoolTC.getType(),
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
	Queries: {
		//? get
		findByName: {
			name: 'findByName',
			type: SchoolTC.getType(),
			args: { schoolName: 'String' },
			resolve: async ({ args, args: { schoolName } }) => {
				return await DataBase.getSchoolByName(schoolName);
			},
		},
	},
};

module.exports = SchoolsResolvers;
