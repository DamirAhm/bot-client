//@ts-check

const { ClassTC } = require('../ModelTypeComposers');

const StudentsRelations = {
	class: {
		resolver: () => ClassTC.getResolver('findById'),
		prepareArgs: {
			// resolver `findByIds` has `_ids` arg, let provide value to it
			_id: (source) => source.class,
		},
		projection: { class: 1 }, // point fields in source object, which should be fetched from DB
	},
};

module.exports = StudentsRelations;
