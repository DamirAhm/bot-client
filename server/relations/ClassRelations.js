// @ts-check

const { StudentTC, SchoolTC } = require('../ModelTypeComposers');

const ClassRelations = {
	students: {
		resolver: () => StudentTC.getResolver('findByIds'),
		prepareArgs: {
			_ids: (source) => source.students,
		},
		projection: { students: 1 },
	},
	school: {
		resolver: () => SchoolTC.getResolver('findByName'),
		prepareArgs: {
			schoolName: (source) => source.schoolName,
		},
		projection: { schoolName: 1 },
	},
};

module.exports = ClassRelations;
