// @ts-nocheck
const { composeWithMongoose } = require('graphql-compose-mongoose');
const { schemaComposer, sc } = require('graphql-compose');
const StudentModel = require('bot-database/Models/StudentModel');
const ClassModel = require('bot-database/Models/ClassModel');
const SchoolModel = require('bot-database/Models/SchoolModel');
const { DataBase: DB, Roles, Lessons, VK_API } = require('bot-database');
const config = require('./config.json');

const DataBase = new DB(config['MONGODB_URI']);
const vk = new VK_API(config['VK_API_KEY']);

const customizationOptions = {};
const StudentTC = composeWithMongoose(StudentModel, customizationOptions);
const ClassTC = composeWithMongoose(ClassModel, customizationOptions);
const SchoolTC = composeWithMongoose(SchoolModel, customizationOptions);

//Custom fields
{
	//!Classes
	{
		ClassTC.addFields({
			studentsCount: {
				type: 'Int!',
				description: 'Number of students',
				prepareArgs: { name: 1, schoolName: 1 },
				resolve: async (source) => {
					const Class = await DataBase.getClassBy_Id(source._id);
					return await DataBase.getStudentsCount(Class.name, Class.schoolName);
				},
			},
		});
	}

	//!Students
	{
		StudentTC.addFields({
			schoolName: {
				type: 'String',
				projection: { class: 1 },
				resolve: async (source) => {
					try {
						if (source.class) {
							return await DataBase.getClassBy_Id(source.class).then(
								(Class) => Class.schoolName,
							);
						} else {
							return null;
						}
					} catch (e) {
						return null;
					}
				},
			},
			className: {
				type: 'String',
				projection: { class: 1 },
				resolve: async (source) => {
					try {
						if (source.class) {
							return await DataBase.getClassBy_Id(source.class).then(
								(Class) => Class.name,
							);
						} else {
							return null;
						}
					} catch (e) {
						return null;
					}
				},
			},
			firstName: {
				type: 'String',
				projection: { vkId: 1 },
				resolve: async (source) => {
					try {
						const student = await DataBase.getStudentBy_Id(source._id);
						if (student && student.firstName) {
							return student.firstName;
						} else if (student) {
							const firstName = await vk
								.getUser(source.vkId)
								.then((res) => res[0].first_name);
							student.firstName = firstName;
							student.save();
							return firstName;
						} else {
							return null;
						}
					} catch (e) {
						return null;
					}
				},
			},
			secondName: {
				type: 'String',
				projection: { vkId: 1 },
				resolve: async (source) => {
					try {
						const student = await DataBase.getStudentBy_Id(source._id);
						if (student && student.secondName) {
							return student.secondName;
						} else if (student) {
							const secondName = await vk
								.getUser(source.vkId)
								.then((res) => res[0].last_name);
							student.lastName = secondName;
							student.save();
							return secondName;
						} else {
							return null;
						}
					} catch (e) {
						return null;
					}
				},
			},
			fullName: {
				type: 'String',
				projection: { vkId: 1 },
				resolve: async (source) => {
					try {
						const student = await DataBase.getStudentBy_Id(source._id);
						if (student && student.fullName) {
							return student.fullName;
						} else if (student) {
							const fullName = await vk
								.getUser(source.vkId)
								.then((res) => res[0])
								.then((res) => res.first_name + ' ' + res.last_name);
							student.fullName = fullName;
							student.save();
							return fullName;
						} else {
							return null;
						}
					} catch (e) {
						return null;
					}
				},
			},
		});
	}
}

//Resolvers
{
	//! Classes
	{
		//* Ovreride
		{
			//? create
			ClassTC.addResolver({
				name: 'classCreateOne',
				type: ClassTC.getType(),
				args: { className: 'String!', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName } }) => {
					return await DataBase.createClass(className, schoolName);
				},
			});
			//? remove
			ClassTC.addResolver({
				name: 'removeOne',
				type: ClassTC.getType(),
				args: { className: 'String!', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName } }) => {
					const School = await DataBase.getSchoolByName(schoolName);
					const Class = await DataBase.getClassByName(className, schoolName);
					const students = Class.students;
					if (students.length > 0) {
						for (let student of students) {
							const Student = await DataBase.getStudentBy_Id(student);
							await Student.updateOne({ class: null });
						}
					}
					await School.updateOne({
						classes: School.classes.filter((classId) => classId !== Class._id),
					});
					await Class.deleteOne();
					return Class;
				},
			});
			//?getForSchool
			ClassTC.addResolver({
				name: 'classesForSchool',
				type: `[${ClassTC.getType()}]`,
				args: { schoolName: 'String' },
				resolve: async ({ args: { schoolName } }) => {
					let Classes;
					if (schoolName) {
						Classes = await DataBase.getClassesForSchool(schoolName);
					} else {
						Classes = await DataBase.getAllClasses();
					}

					return Classes || [];
				},
			});
		}
		//* Schedule
		{
			//? get
			ClassTC.addResolver({
				name: 'getSchedule',
				type: '[ [ String ] ]',
				args: { className: 'String!', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName } }) => {
					const Class = await DataBase.getClassByName(className, schoolName);

					if (Class) {
						return Class.schedule;
					} else {
						return null;
					}
				},
			});
			//? change
			ClassTC.addResolver({
				name: 'changeDay',
				type: ClassTC.getType(),
				args: {
					className: 'String!',
					dayIndex: 'Int!',
					newSchedule: '[String]!',
					schoolName: 'String!',
				},
				resolve: async ({ args: { className, schoolName, dayIndex, newSchedule } }) => {
					await DataBase.changeDay({ className, schoolName }, dayIndex, newSchedule);
					return await DataBase.getClassByName(className, schoolName);
				},
			});
		}
		//* Announcements
		{
			//? get
			ClassTC.addResolver({
				name: 'getAnnouncements',
				type: `[${ClassTC.get('announcements').getType()}]`,
				args: { className: 'String!', date: 'Date', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName, date } }) => {
					return await DataBase.getAnnouncements({ className, schoolName }, date);
				},
			});
			//? add
			ClassTC.addResolver({
				name: 'addAnnouncement',
				type: ClassTC.get('announcements').getType(),
				args: {
					student_id: 'Int!',
					className: 'String!',
					text: 'String!',
					to: 'String',
					attachments: `[${ClassTC.get('homework.attachments').getInputType()}]!`,
					schoolName: 'String!',
				},
				resolve: async ({
					args: { attachments, text, to, className, student_id, schoolName },
				}) => {
					try {
						if (attachments) {
							for (const attachment of attachments) {
								delete attachment._id;
							}
						}

						const announcement_Id = await DataBase.addAnnouncement(
							{ className, schoolName },
							{ attachments, text },
							new Date(to),
							false,
							student_id,
						);

						if (announcement_Id) {
							return await DataBase.getClassByName(className, schoolName).then((c) =>
								c.announcements.find(
									(ch) => ch._id.toString() === announcement_Id.toString(),
								),
							);
						} else {
							return null;
						}
					} catch (e) {
						console.error(e);
						return null;
					}
				},
			});
			//? remove
			ClassTC.addResolver({
				name: 'removeAnnouncement',
				type: 'String',
				args: { className: 'String!', announcementId: 'String!', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName, announcementId } }) => {
					const result = await DataBase.removeAnnouncement(
						{ className, schoolName },
						announcementId,
					);
					if (result) {
						return announcementId;
					}
					return null;
				},
			});
			//? change
			ClassTC.addResolver({
				name: 'updateAnnouncement',
				type: ClassTC.get('announcements').getType(),
				args: {
					className: 'String!',
					announcementId: 'String!',
					updates: `${ClassTC.get('announcements').getInputType()}!`,
					schoolName: 'String!',
				},
				resolve: async ({ args: { className, schoolName, announcementId, updates } }) => {
					const { attachments } = updates;
					if (attachments) {
						for (const attachment of attachments) {
							delete attachment._id;
						}
					}
					const updatedAnnouncement = await DataBase.updateAnnouncement(
						{ className, schoolName },
						announcementId,
						updates,
					);
					if (updatedAnnouncement) {
						return updatedAnnouncement.find((e) => e._id.toString() === announcementId);
					} else {
						return null;
					}
				},
			});
			//? remove old
			ClassTC.addResolver({
				name: 'removeOldAnnouncements',
				type: `[${ClassTC.get('announcements').getType()}]`,
				args: { className: 'String!', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName } }) => {
					try {
						const actualAnnouncements = await DataBase.removeOldAnnouncements({
							className,
							schoolName,
						});

						return actualAnnouncements;
					} catch (e) {
						console.error(e);
						return null;
					}
				},
			});
		}
		//* Homework
		{
			//? get
			ClassTC.addResolver({
				name: 'getHomework',
				type: `[${ClassTC.get('homework').getType()}]`,
				args: { className: 'String!', date: 'Date', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName, date } }) => {
					return (await DataBase.getHomework({ className, schoolName }, date)) || [];
				},
			});
			//? remove
			ClassTC.addResolver({
				name: 'removeHomework',
				type: 'String',
				args: { className: 'String!', homeworkId: 'String!', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName, homeworkId } }) => {
					await DataBase.removeHomework({ className, schoolName }, homeworkId);
					return homeworkId;
				},
			});
			//TODO replace return of addHomework from _id to object
			//? add
			ClassTC.addResolver({
				name: 'addHomework',
				type: ClassTC.get('homework').getType(),
				args: {
					student_id: 'Int!',
					className: 'String!',
					text: 'String!',
					to: 'String',
					lesson: 'String!',
					attachments: `[${ClassTC.get('homework.attachments').getInputType()}]!`,
					schoolName: 'String!',
				}, //TODO think about attachments
				resolve: async ({ args, args: { className, schoolName, attachments, text } }) => {
					if (attachments) {
						for (const attachment of attachments) {
							delete attachment._id;
						}
					}
					const id = await DataBase.addHomework(
						{ className, schoolName },
						args.lesson,
						{ text, attachments },
						args.student_id,
						args.to,
					);
					if (id) {
						const hw = await DataBase.getClassByName(className, schoolName).then((cl) =>
							cl.homework.find((e) => e._id.toString() === id.toString()),
						);

						return hw;
					}
					return null;
				},
			});
			//? change
			ClassTC.addResolver({
				name: 'updateHomework',
				type: ClassTC.get('homework').getType(),
				args: {
					className: 'String!',
					homeworkId: 'String!',
					updates: ClassTC.get('homework').getInputType(),
					schoolName: 'String!',
				},
				resolve: async ({ args: { className, schoolName, homeworkId, updates } }) => {
					const Class = await DataBase.getClassByName(className, schoolName);
					if (Class.homework.find((e) => e._id.toString() === homeworkId.toString())) {
						if (updates.attachments) {
							for (const attachment of updates.attachments) {
								delete attachment._id;
							}
						}
						const updatedHomework = await DataBase.updateHomework(
							{ className, schoolName },
							homeworkId,
							updates,
						);

						return updatedHomework.find(
							(e) => e._id.toString() === homeworkId.toString(),
						);
					} else {
						return null;
					}
				},
			});
			//? remove old
			ClassTC.addResolver({
				name: 'removeOldHomework',
				type: `[${ClassTC.get('homework').getType()}]`,
				args: { className: 'String!', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName } }) => {
					try {
						const actualHomework = await DataBase.removeOldHomework({
							className,
							schoolName,
						});

						return actualHomework;
					} catch (e) {
						// console.error( e );
						return null;
					}
				},
			});
		}
	}

	//! Students
	{
		//* Ovreride
		{
			//? Remove
			StudentTC.addResolver({
				name: 'removeOne',
				type: StudentTC.getType(),
				args: { vkId: 'Int!' },
				resolve: async ({ args: { vkId } }) => {
					const Student = await DataBase.getStudentByVkId(vkId);
					const Class = Student.class;
					if (Class) {
						await DataBase.removeStudentFromClass(vkId);
					}
					await Student.deleteOne();
					return Student.toJSON({ virtuals: true });
				},
			});
			//? Create
			StudentTC.addResolver({
				name: 'studentCreateOne',
				type: StudentTC.getType(),
				args: { vkId: 'Int!' },
				resolve: async ({ args: { vkId } }) => {
					return (await DataBase.createStudent(vkId)).toJSON({ virtuals: true });
				},
			});
			//? Many
			StudentTC.addResolver({
				name: 'findMany',
				type: `[${StudentTC.getType()}]`,
				resolve: async () => {
					return (await DataBase.getAllStudents()).map((student) =>
						student.toJSON({ virtuals: true }),
					);
				},
			});
		}
		//* Settings
		{
			//? Change
			StudentTC.addResolver({
				name: 'changeSettings',
				type: 'Boolean',
				args: {
					vkId: 'Int!',
					diffObject: StudentTC.get('settings').getInputType(),
				},
				resolve: async ({ args: { vkId, diffObject } }) => {
					return await DataBase.changeSettings(vkId, diffObject);
				},
			});
		}
		//* Actions
		{
			//? Change class
			StudentTC.addResolver({
				name: 'changeClass',
				type: StudentTC.getType(),
				args: { vkId: 'Int!', newClassName: 'String!', schoolName: 'String!' },
				resolve: async ({ args: { vkId, newClassName, schoolName } }) => {
					if (newClassName !== 'Нету') {
						await DataBase.changeClass(vkId, newClassName, schoolName);
					} else {
						await DataBase.removeStudentFromClass(vkId);
					}
					return (await DataBase.getStudentByVkId(vkId)).toJSON({ virtuals: true });
				},
			});
			//? Remove from class
			StudentTC.addResolver({
				name: 'removeStudentFromClass',
				type: StudentTC.getType(),
				args: { vkId: 'Int!' },
				resolve: async ({ args: { vkId } }) => {
					const res = await DataBase.removeStudentFromClass(vkId);

					if (res) {
						return (await DataBase.getStudentByVkId(vkId)).toJSON({ virtuals: true });
					} else {
						return null;
					}
				},
			});
		}
		//* Getters
		{
			//? Get for class
			StudentTC.addResolver({
				name: 'getForClass',
				type: `[${StudentTC.getType()}]`,
				args: { className: 'String', schoolName: 'String!' },
				resolve: async ({ args: { schoolName, className } }) => {
					const studentIds = await DataBase.getStudentsFromClass(className, schoolName);

					if (studentIds) {
						const studentPromises = studentIds.map((vkId) =>
							DataBase.getStudentByVkId(vkId),
						);

						const students = [];

						for await (const student of studentPromises)
							students.push(student.toJSON({ virtuals: true }));
						return students;
					} else {
						return null;
					}
				},
			});
			StudentTC.addResolver({
				name: 'studentsForSchool',
				args: { schoolName: 'String' },
				type: `[${StudentTC.getType()}]`,
				resolve: async ({ args: { schoolName } }) => {
					if (schoolName) {
						return (await DataBase.getStudentsForSchool(schoolName)).map((student) =>
							student.toJSON({ virtuals: true }),
						);
					} else {
						return (await DataBase.getAllStudents()).map((student) =>
							student.toJSON({ virtuals: true }),
						);
					}
				},
			});
		}
	}

	//!Schools
	{
		//* Ovreride
		//? create
		SchoolTC.addResolver({
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
		});
	}

	//! Common
	{
		//? lessons
		ClassTC.addResolver({
			name: 'lessons',
			type: '[String]',
			args: {},
			resolve: async () => {
				return Lessons;
			},
		});
		StudentTC.addResolver({
			name: 'roles',
			type: '[String]',
			args: {},
			resolve: async () => {
				return Object.values(Roles);
			},
		});
	}
}

//Relations
{
	//! Classes
	{
		ClassTC.addRelation('students', {
			resolver: () => StudentTC.getResolver('findByIds'),
			prepareArgs: {
				_ids: (source) => source.students,
			},
			projection: { students: 1 },
		});
	}
	//! Students
	{
		StudentTC.addRelation('class', {
			resolver: () => ClassTC.getResolver('findById'),
			prepareArgs: {
				// resolver `findByIds` has `_ids` arg, let provide value to it
				_id: (source) => source.class,
			},
			projection: { class: 1 }, // point fields in source object, which should be fetched from DB
		});
	}
	//!Schools
	{
		SchoolTC.addRelation('classes', {
			resolver: () => ClassTC.getResolver('findByIds'),
			prepareArgs: {
				// resolver `findByIds` has `_ids` arg, let provide value to it
				_ids: (source) => source.classes,
			},
			projection: { classes: 1 }, // point fields in source object, which should be fetched from DB
		});
	}
}

schemaComposer.Query.addFields({
	studentById: StudentTC.getResolver('findById'),
	studentByIds: StudentTC.getResolver('findByIds'),
	studentOne: StudentTC.getResolver('findOne'),
	studentMany: StudentTC.getResolver('findMany'),
	studentCount: StudentTC.getResolver('count'),
	studentConnection: StudentTC.getResolver('connection'),
	studentPagination: StudentTC.getResolver('pagination'),
	studentsFromSchool: StudentTC.getResolver('studentsForSchool'),
	classById: ClassTC.getResolver('findById'),
	classByIds: ClassTC.getResolver('findByIds'),
	classOne: ClassTC.getResolver('findOne'),
	classMany: ClassTC.getResolver('findMany'),
	classesForSchool: ClassTC.getResolver('classesForSchool'),
	classCount: ClassTC.getResolver('count'),
	classConnection: ClassTC.getResolver('connection'),
	classPagination: ClassTC.getResolver('pagination'),
	schoolById: SchoolTC.getResolver('findById'),
	schoolByIds: SchoolTC.getResolver('findByIds'),
	schoolOne: SchoolTC.getResolver('findOne'),
	schoolMany: SchoolTC.getResolver('findMany'),
	schoolCount: SchoolTC.getResolver('count'),
	schoolConnection: SchoolTC.getResolver('connection'),
	schoolPagination: SchoolTC.getResolver('pagination'),
	getHomework: ClassTC.getResolver('getHomework'),
	getAnnouncements: ClassTC.getResolver('getAnnouncements'),
	getLessons: ClassTC.getResolver('lessons'),
	getRoles: StudentTC.getResolver('roles'),
	studentsForClass: StudentTC.getResolver('getForClass'),
	getSchedule: ClassTC.getResolver('getSchedule'),
});
schemaComposer.Mutation.addFields({
	studentCreateOne: StudentTC.getResolver('studentCreateOne'),
	studentCreateMany: StudentTC.getResolver('createMany'),
	studentUpdateById: StudentTC.getResolver('updateById'),
	studentUpdateOne: StudentTC.getResolver('updateOne'),
	studentUpdateMany: StudentTC.getResolver('updateMany'),
	studentRemoveById: StudentTC.getResolver('removeById'),
	studentRemoveOne: StudentTC.getResolver('removeOne'),
	studentRemoveMany: StudentTC.getResolver('removeMany'),
	classCreateOne: ClassTC.getResolver('classCreateOne'),
	classCreateMany: ClassTC.getResolver('createMany'),
	classUpdateById: ClassTC.getResolver('updateById'),
	classUpdateOne: ClassTC.getResolver('updateOne'),
	classUpdateMany: ClassTC.getResolver('updateMany'),
	classRemoveById: ClassTC.getResolver('removeById'),
	classRemoveOne: ClassTC.getResolver('removeOne'),
	classRemoveMany: ClassTC.getResolver('removeMany'),
	schoolCreateOne: SchoolTC.getResolver('schoolCreateOne'),
	schoolCreateMany: SchoolTC.getResolver('createMany'),
	schoolUpdateById: SchoolTC.getResolver('updateById'),
	schoolUpdateOne: SchoolTC.getResolver('updateOne'),
	schoolUpdateMany: SchoolTC.getResolver('updateMany'),
	schoolRemoveById: SchoolTC.getResolver('removeById'),
	schoolRemoveOne: SchoolTC.getResolver('removeOne'),
	schoolRemoveMany: SchoolTC.getResolver('removeMany'),
	changeDay: ClassTC.getResolver('changeDay'),
	changeSettings: StudentTC.getResolver('changeSettings'),
	removeStudentFromClass: StudentTC.getResolver('removeStudentFromClass'),
	changeClass: StudentTC.getResolver('changeClass'),
	addHomework: ClassTC.getResolver('addHomework'),
	removeHomework: ClassTC.getResolver('removeHomework'),
	updateHomework: ClassTC.getResolver('updateHomework'),
	addAnnouncement: ClassTC.getResolver('addAnnouncement'),
	removeAnnouncement: ClassTC.getResolver('removeAnnouncement'),
	updateAnnouncement: ClassTC.getResolver('updateAnnouncement'),
	removeOldAnnouncements: ClassTC.getResolver('removeOldAnnouncements'),
	removeOldHomework: ClassTC.getResolver('removeOldHomework'),
});

const graphqlSchema = schemaComposer.buildSchema();

module.exports = {
	graphqlSchema,
};
