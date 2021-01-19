// @ts-check

const { StudentTC } = require('../ModelTypeComposers');

const ClassRelations = {
	students: {
		resolver: () => StudentTC.getResolver('findByIds'),
		prepareArgs: {
			_ids: (source) => source.students,
		},
		projection: { students: 1 },
	},
};

module.exports = ClassRelations;
