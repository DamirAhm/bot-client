// @ts-check
const { schemaComposer } = require('graphql-compose');

const { ClassTC, SchoolTC, StudentTC } = require('./ModelTypeComposers');

const StudentFields = require('./fields/StudentFields');
const ClassFields = require('./fields/ClassFields');
const ClassResolvers = require('./resolvers/ClassResolvers');
const StudentResolvers = require('./resolvers/StudentsResolvers');
const SchoolResolvers = require('./resolvers/SchoolResolvers');
const CommonResolvers = require('./resolvers/CommonResolvers');
const ClassRelations = require('./relations/ClassRelations');
const StudentsRelations = require('./relations/StudentRelations');
const SchoolRelations = require('./relations/SchoolRelations');

const appendRelations = (ModelTC, relationsObject) => {
	for (let relationName in relationsObject) {
		if (relationsObject.hasOwnProperty(relationName)) {
			ModelTC.addRelation(relationName, relationsObject[relationName]);
		}
	}
};

//! Custom fields
StudentTC.addFields(StudentFields);
ClassTC.addFields(ClassFields);
//! Relations
appendRelations(ClassTC, ClassRelations);
appendRelations(StudentTC, StudentsRelations);
appendRelations(SchoolTC, SchoolRelations);

schemaComposer.Subscription.addFields({
	...ClassResolvers.Subscriptions,
	...StudentResolvers.Subscriptions,
});
schemaComposer.Query.addFields({
	...ClassResolvers.Queries,
	...StudentResolvers.Queries,
	...SchoolResolvers.Queries,
	...CommonResolvers.Queries,
	schoolsMany: SchoolTC.getResolver('findMany'),
});
schemaComposer.Mutation.addFields({
	...ClassResolvers.Mutations,
	...StudentResolvers.Mutations,
	...SchoolResolvers.Mutations,
	...CommonResolvers.Mutations,
	studentUpdateOne: StudentTC.getResolver('updateOne'),
});

schemaComposer.addTypeDefs(`
	type creationConfirmation {
		stabId: String!
		actualId: String! 
		schoolName: String!
		className: String!
	}

	type scheduleChange {
		dayIndex: Int!
		newSchedule: [String]!
		className: String!
		schoolName: String!
	}
	type studentSchoolChange {
		student: Student!
		schoolName: String!
		className: String!
	} 
	type homeworkChange {
		lesson: String
		text: String
		to: Date
		attachments: [ClassHomeworkAttachments]
		createdBy: Float
		pinned: Boolean
		_id: MongoID
		className: String!
		schoolName: String! 
	}
	type announcementChange {
		text: String
		to: Date
		attachments: [ClassHomeworkAttachments]
		createdBy: Float
		pinned: Boolean
		_id: MongoID
		className: String!
		schoolName: String! 
	}
	type homeworkAdd {
		lesson: String
		text: String
		to: Date
		attachments: [ClassHomeworkAttachments]
		createdBy: Float
		pinned: Boolean
		_id: MongoID
		className: String!
		schoolName: String! 
	}
	type announcementAdd {
		text: String
		to: Date
		attachments: [ClassHomeworkAttachments]
		createdBy: Float
		pinned: Boolean
		_id: MongoID
		className: String!
		schoolName: String! 
	}
`);

const graphqlSchema = schemaComposer.buildSchema();

module.exports = {
	graphqlSchema,
};
