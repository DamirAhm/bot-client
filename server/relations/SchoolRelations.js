// @ts-check

const { ClassTC } = require('../ModelTypeComposers');

const SchoolRelations = {
	classes: {
		resolver: () => ClassTC.getResolver('findByIds'),
		prepareArgs: {
			// resolver `findByIds` has `_ids` arg, let provide value to it
			_ids: (source) => source.classes,
		},
		projection: { classes: 1 }, // point fields in source object, which should be fetched from DB
	},
};

module.exports = SchoolRelations;
