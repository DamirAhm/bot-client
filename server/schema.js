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
const appendResolvers = (ModelTC, ModelResolvers) => {
	const QueryResolvers = Object.keys(ModelResolvers.Queries);
	const MutationsResolvers = Object.keys(ModelResolvers.Mutations);

	for (const resolverName of QueryResolvers) {
		ModelTC.addResolver(ModelResolvers.Queries[resolverName]);
	}
	for (const resolverName of MutationsResolvers) {
		ModelTC.addResolver(ModelResolvers.Mutations[resolverName]);
	}

	return [QueryResolvers, MutationsResolvers];
};
const appendFieldsToSchema = (ModelTC, QueryResolverNames, MutationsResolverNames) => {
	const queryFields = QueryResolverNames.reduce(
		(acc, resolverName) => ({ ...acc, [resolverName]: ModelTC.getResolver(resolverName) }),
		{},
	);
	const mutationsFields = MutationsResolverNames.reduce(
		(acc, resolverName) => ({ ...acc, [resolverName]: ModelTC.getResolver(resolverName) }),
		{},
	);

	schemaComposer.Query.addFields(queryFields);
	schemaComposer.Mutation.addFields(mutationsFields);
};

schemaComposer.Subscription.addFields({
	...ClassResolvers.Subscriptions,
	...StudentResolvers.Subscriptions,
});
schemaComposer.Query.addFields({
	schoolsMany: SchoolTC.getResolver('findMany'),
	studentOne: StudentTC.getResolver('findOne'),
	studentMany: StudentTC.getResolver('findMany'),
	classOne: ClassTC.getResolver('findOne'),
});
schemaComposer.Mutation.addFields({
	studentUpdateOne: StudentTC.getResolver('updateOne'),
});
//! Custom fields
StudentTC.addFields(StudentFields);
ClassTC.addFields(ClassFields);
//! Relations
appendRelations(ClassTC, ClassRelations);
appendRelations(StudentTC, StudentsRelations);
appendRelations(SchoolTC, SchoolRelations);
//! Resolvers
const [QueryClassResolverNames, MutationsClassResolverNames] = appendResolvers(
	ClassTC,
	ClassResolvers,
);
const [QueryCommonResolverNames, MutationsCommonResolverNames] = appendResolvers(
	ClassTC,
	CommonResolvers,
);
const [QueryStudentResolverNames, MutationsStudentResolverNames] = appendResolvers(
	StudentTC,
	StudentResolvers,
);
const [QuerySchoolResolverNames, MutationsSchoolResolverNames] = appendResolvers(
	SchoolTC,
	SchoolResolvers,
);
//! Adding fields
appendFieldsToSchema(
	ClassTC,
	QueryClassResolverNames.concat(QueryCommonResolverNames),
	MutationsClassResolverNames.concat(MutationsCommonResolverNames),
);
appendFieldsToSchema(StudentTC, QueryStudentResolverNames, MutationsStudentResolverNames);
appendFieldsToSchema(SchoolTC, QuerySchoolResolverNames, MutationsSchoolResolverNames);

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
