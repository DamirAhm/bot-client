// @ts-check
const { DataBase: DB } = require('bot-database');

const DataBase = new DB(process.env.MONGODB_URI);

const classFields = {
	studentsCount: {
		type: 'Int!',
		description: 'Number of students',
		prepareArgs: { name: 1, schoolName: 1 },
		resolve: async (source) => {
			const Class = await DataBase.getClassBy_Id(source._id);
			return await DataBase.getStudentsCount(Class.name, Class.schoolName);
		},
	},
};

module.exports = classFields;
