// @ts-check

const { default: ClassModel } = require('bot-database/build/Models/ClassModel');
const { default: SchoolModel } = require('bot-database/build/Models/SchoolModel');
const { default: StudentModel } = require('bot-database/build/Models/StudentModel');
const { default: composeWithMongoose } = require('graphql-compose-mongoose');

const StudentTC = composeWithMongoose(StudentModel, {});
const ClassTC = composeWithMongoose(ClassModel, {});
const SchoolTC = composeWithMongoose(SchoolModel, {});

module.exports = {
	StudentTC,
	ClassTC,
	SchoolTC,
};
