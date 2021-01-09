// @ts-check
const { composeWithMongoose } = require('graphql-compose-mongoose');
const { schemaComposer } = require('graphql-compose');
const { PubSub, withFilter } = require('apollo-server-express');
const StudentModel = require('bot-database/build/Models/StudentModel').default;
const ClassModel = require('bot-database/build/Models/ClassModel').default;
const SchoolModel = require('bot-database/build/Models/SchoolModel').default;
const { DataBase: DB, Roles, Lessons, VK_API } = require('bot-database');

const config = require('./config.json');

const DataBase = new DB(process.env.MONGODB_URI);
const vk = new VK_API(process.env.VK_API_KEY, +config['GROUP_ID'], +config['ALBUM_ID']);
const customizationOptions = {};
const StudentTC = composeWithMongoose(StudentModel, customizationOptions);
const ClassTC = composeWithMongoose(ClassModel, customizationOptions);
const SchoolTC = composeWithMongoose(SchoolModel, customizationOptions);

const isRightClass = (name) => (response, variables) =>
	response[name].schoolName === variables.schoolName &&
	response[name].className === variables.className;

const pubsub = new PubSub();

//!Subscription events
//* Anouncements
const ON_ANNOUNCEMENT_ADDED = 'ON_ANNOUNCEMENT_ADDED';
const ON_ANNOUNCEMENTS_REMOVED = 'ON_ANNOUNCEMENTS_REMOVED';
const ON_ANNOUNCEMENT_CONFIRMED = 'ON_ANNOUNCEMENT_CONFIRMED';
const ON_ANNOUNCEMENT_CHANGED = 'ON_ANNOUNCEMENT_CHANGED';
//* Homework
const ON_HOMEWORK_ADDED = 'ON_HOMEWORK_ADDED';
const ON_HOMEWORKS_REMOVED = 'ON_HOMEWORKS_REMOVED';
const ON_HOMEWORK_CONFIRMED = 'ON_HOMEWORK_CONFIRMED';
const ON_HOMEWORK_CHANGED = 'ON_HOMEWORK_CHANGED';
//* Schedule
const ON_SCHEDULE_CHANGED = 'ON_SCHEDULE_CHANGED';
//* Student
const ON_STUDENT_ADDED_TO_CLASS = 'ON_STUDENT_ADDED_TO_CLASS';
const ON_STUDENT_REMOVED_FROM_CLASS = 'ON_STUDENT_REMOVED_FROM_CLASS';

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
			lastName: {
				type: 'String',
				projection: { vkId: 1 },
				resolve: async (source) => {
					try {
						const student = await DataBase.getStudentBy_Id(source._id);
						if (student && student.lastName) {
							return student.lastName;
						} else if (student) {
							const lastName = await vk
								.getUser(source.vkId)
								.then((res) => res[0].last_name);
							student.lastName = lastName;
							student.save();
							return lastName;
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
					await Class.remove();
					return Class;
				},
			});
			//?getForSchool
			ClassTC.addResolver({
				name: 'classesForSchool',
				type: ClassTC.List.getType(),
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
				//@ts-ignore
				type: ClassTC.get('schedule').List.getType(),
				args: {
					className: 'String!',
					dayIndex: 'Int!',
					newSchedule: '[String]!',
					schoolName: 'String!',
				},
				resolve: async ({ args: { className, schoolName, dayIndex, newSchedule } }) => {
					pubsub.publish(ON_SCHEDULE_CHANGED, {
						onScheduleChanged: {
							dayIndex,
							newSchedule,
							className,
							schoolName,
						},
					});
					const res = await DataBase.changeDay(
						{ classNameOrInstance: className, schoolName },
						dayIndex,
						newSchedule,
					);

					const schedule = await DataBase.getSchedule({
						classNameOrInstance: className,
						schoolName,
					});

					if (!res) {
						pubsub.publish(ON_SCHEDULE_CHANGED, {
							dayIndex,
							newSchedule: schedule,
							className,
							schoolName,
						});
					}

					return schedule[dayIndex];
				},
			});
		}
		//* Announcements
		{
			//? get
			ClassTC.addResolver({
				name: 'getAnnouncements',
				// @ts-ignore
				type: ClassTC.get('announcements').List.getType(),
				args: { className: 'String!', date: 'Date', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName, date } }) => {
					return await DataBase.getAnnouncements(
						{ classNameOrInstance: className, schoolName },
						date,
					);
				},
			});
			//? add
			ClassTC.addResolver({
				name: 'addAnnouncement',
				// @ts-ignore
				type: ClassTC.get('announcements').getType(),
				args: {
					student_id: 'Int!',
					className: 'String!',
					text: 'String!',
					to: 'String',
					attachments: ClassTC.get('homework.attachments')
						//@ts-ignore
						.getInputTypeComposer()
						.List.NonNull.getType(),
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

						const stabId = Date.now().toString();
						pubsub.publish(ON_ANNOUNCEMENT_ADDED, {
							onAnnouncementAdded: {
								text,
								to,
								attachments,
								student_id,
								_id: stabId,
								pinned: false,
								className,
								schoolName,
							},
						});
						const announcement_Id = await DataBase.addAnnouncement(
							{ classNameOrInstance: className, schoolName },
							{ attachments, text },
							new Date(to),
							false,
							student_id,
						);

						if (announcement_Id) {
							pubsub.publish(ON_ANNOUNCEMENT_CONFIRMED, {
								onAnnouncementConfirmed: {
									stabId,
									actualId: announcement_Id,
									className,
									schoolName,
								},
							});
							return await DataBase.getClassByName(className, schoolName).then((c) =>
								c.announcements.find(
									(ch) => ch._id.toString() === announcement_Id.toString(),
								),
							);
						} else {
							pubsub.publish(ON_ANNOUNCEMENTS_REMOVED, {
								onAnnouncementsRemoved: [stabId],
							});
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
					pubsub.publish(ON_ANNOUNCEMENTS_REMOVED, {
						onAnnouncementsRemoved: [announcementId],
					});

					const result = await DataBase.removeAnnouncement(
						{ classNameOrInstance: className, schoolName },
						announcementId,
					);
					if (result) {
						return announcementId;
					} else {
						const AllAnnouncements = await DataBase.getHomework({
							classNameOrInstance: className,
							schoolName,
						});
						const notRemovedAnnouncement = AllAnnouncements.find(
							({ _id }) => _id.toString() === announcementId,
						);

						if (notRemovedAnnouncement) {
							pubsub.publish(ON_ANNOUNCEMENT_ADDED, {
								onAnnouncementAdded: {
									...notRemovedAnnouncement,
									className,
									schoolName,
								},
							});
						}

						return null;
					}
				},
			});
			//? change
			ClassTC.addResolver({
				name: 'updateAnnouncement',
				// @ts-ignore
				type: ClassTC.get('announcements').getType(),
				args: {
					className: 'String!',
					announcementId: 'String!',
					// @ts-ignore
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
					pubsub.publish(ON_ANNOUNCEMENT_CHANGED, {
						onAnnouncementChanged: {
							_id: announcementId,
							...updates,
							className,
							schoolName,
						},
					});

					const updatedAnnouncement = await DataBase.updateAnnouncement(
						{ classNameOrInstance: className, schoolName },
						announcementId,
						updates,
					);

					if (updatedAnnouncement) {
						return updatedAnnouncement.find((e) => e._id.toString() === announcementId);
					} else {
						const unchangedAnnouncements = await DataBase.getHomework({
							classNameOrInstance: className,
							schoolName,
						});
						const unchangedAnnouncement = unchangedAnnouncements.find(
							({ _id }) => _id.toString() === announcementId,
						);

						pubsub.publish(ON_ANNOUNCEMENT_CHANGED, {
							onAnnouncementChanged: {
								...unchangedAnnouncement,
								className,
								schoolName,
							},
						});

						return null;
					}
				},
			});
			//? remove old
			ClassTC.addResolver({
				name: 'removeOldAnnouncements',
				// @ts-ignore
				type: ClassTC.get('announcements').List.getType(),
				args: { className: 'String!', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName } }) => {
					try {
						const AllAnnouncements = await DataBase.getHomework({
							classNameOrInstance: className,
							schoolName,
						});

						const actualAnnouncements = await DataBase.removeOldAnnouncements({
							classNameOrInstance: className,
							schoolName,
						});

						const removedAnnouncements = AllAnnouncements.filter(
							({ _id }) =>
								!actualAnnouncements.find(
									({ _id: anId }) => _id.toString() === anId.toString(),
								),
						);
						const removedAnnouncementsIds = removedAnnouncements.map(({ _id }) => _id);

						if (removedAnnouncementsIds.length) {
							pubsub.publish(ON_ANNOUNCEMENTS_REMOVED, {
								onAnnouncementsRemoved: removedAnnouncementsIds,
							});
						}

						return actualAnnouncements;
					} catch (e) {
						console.error(e);
						return null;
					}
				},
			});
			//? pin
			ClassTC.addResolver({
				name: 'pinAnnouncement',
				// @ts-ignore
				type: ClassTC.get('announcements').getType(),
				args: { className: 'String!', schoolName: 'String!', announcementId: 'String!' },
				resolve: async ({ args: { className, schoolName, announcementId } }) => {
					try {
						const res = await DataBase.togglePinAnnouncement(
							{ classNameOrInstance: className, schoolName },
							announcementId,
						);

						if (res) {
							const Class = await DataBase.getClassByName(className, schoolName);

							if (Class) {
								const pinnedAnnouncement = Class.announcements.find(
									({ _id }) => _id.toString() === announcementId,
								);

								pubsub.publish(ON_ANNOUNCEMENT_CHANGED, {
									onAnnouncementChanged: {
										_id: announcementId,
										pinned: pinnedAnnouncement.pinned,
										className,
										schoolName,
									},
								});

								return pinnedAnnouncement;
							}
						}

						return null;
					} catch (e) {
						console.log(e);

						return null;
					}
				},
			});
			//? unpinAll
			ClassTC.addResolver({
				name: 'unpinAllAnnouncements',
				type: 'Boolean',
				args: { className: 'String!', schoolName: 'String!' },
				resolve: async ({ args }) => {
					try {
						const res = await DataBase.unpinAllAnnouncements(args);

						return res;
					} catch (e) {
						console.error(e);
						return false;
					}
				},
			});
		}
		//* Homework
		{
			//? get
			ClassTC.addResolver({
				name: 'getHomework',
				// @ts-ignore
				type: ClassTC.get('homework').List.getType(),
				args: { className: 'String!', date: 'Date', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName, date } }) => {
					return (
						(await DataBase.getHomework(
							{ classNameOrInstance: className, schoolName },
							date,
						)) || []
					);
				},
			});
			//? remove
			ClassTC.addResolver({
				name: 'removeHomework',
				type: 'String',
				args: { className: 'String!', homeworkId: 'String!', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName, homeworkId } }) => {
					pubsub.publish(ON_HOMEWORKS_REMOVED, {
						onHomeworksRemoved: [homeworkId],
					});

					const res = await DataBase.removeHomework(
						{ classNameOrInstance: className, schoolName },
						homeworkId,
					);

					if (res) {
						return homeworkId;
					} else {
						const AllHomeworks = await DataBase.getHomework({
							classNameOrInstance: className,
							schoolName,
						});
						const notRemovedHomework = AllHomeworks.find(
							({ _id }) => _id.toString() === homeworkId,
						);

						if (notRemovedHomework) {
							pubsub.publish(ON_HOMEWORK_ADDED, {
								onHomeworkAdded: {
									...notRemovedHomework,
									className,
									schoolName,
								},
							});
						}

						return null;
					}
				},
			});
			//? add
			ClassTC.addResolver({
				name: 'addHomework',
				// @ts-ignore
				type: ClassTC.get('homework').getType(),
				args: {
					student_id: 'Int!',
					className: 'String!',
					text: 'String!',
					to: 'String',
					lesson: 'String!',
					attachments: ClassTC.get('homework.attachments')
						// @ts-ignore
						.getInputTypeComposer()
						.List.NonNull.getType(),
					schoolName: 'String!',
				},
				resolve: async ({
					args: { className, schoolName, attachments, text, lesson, student_id, to },
				}) => {
					if (attachments) {
						for (const attachment of attachments) {
							delete attachment._id;
						}
					}

					const stabId = Date.now().toString();
					pubsub.publish(ON_HOMEWORK_ADDED, {
						onHomeworkAdded: {
							text,
							to,
							attachments,
							student_id,
							_id: stabId,
							pinned: false,
							className,
							schoolName,
						},
					});

					const homework_id = await DataBase.addHomework(
						{ classNameOrInstance: className, schoolName },
						lesson,
						// @ts-ignore
						{ text, attachments },
						student_id,
						to,
					);
					if (homework_id) {
						pubsub.publish(ON_HOMEWORK_CONFIRMED, {
							onHomeworkConfirmed: {
								stabId,
								actualId: homework_id,
								className,
								schoolName,
							},
						});
						const hw = await DataBase.getClassByName(className, schoolName).then((cl) =>
							cl.homework.find((e) => e._id.toString() === homework_id.toString()),
						);

						return hw;
					} else {
						pubsub.publish(ON_HOMEWORKS_REMOVED, {
							onHomeworksRemoved: [stabId],
						});
						return null;
					}
				},
			});
			//? change
			ClassTC.addResolver({
				name: 'updateHomework',
				// @ts-ignore
				type: ClassTC.get('homework').getType(),
				args: {
					className: 'String!',
					homeworkId: 'String!',
					// @ts-ignore
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

						pubsub.publish(ON_HOMEWORK_CHANGED, {
							onHomeworkChanged: {
								_id: homeworkId,
								...updates,
								className,
								schoolName,
							},
						});

						const updatedHomework = await DataBase.updateHomework(
							{ classNameOrInstance: className, schoolName },
							homeworkId,
							updates,
						);

						return updatedHomework.find(
							(e) => e._id.toString() === homeworkId.toString(),
						);
					} else {
						const unchangedHomeworks = await DataBase.getHomework({
							classNameOrInstance: className,
							schoolName,
						});
						const unchangedHomework = unchangedHomeworks.find(
							({ _id }) => _id.toString() === homeworkId,
						);

						pubsub.publish(ON_HOMEWORK_CHANGED, {
							onHomeworkChanged: {
								...unchangedHomework,
								className,
								schoolName,
							},
						});

						return null;
					}
				},
			});
			//? remove old
			ClassTC.addResolver({
				name: 'removeOldHomework',
				// @ts-ignore
				type: ClassTC.get('homework').List.getType(),
				args: { className: 'String!', schoolName: 'String!' },
				resolve: async ({ args: { className, schoolName } }) => {
					try {
						const AllHomeworks = await DataBase.getHomework({
							classNameOrInstance: className,
							schoolName,
						});
						const actualHomework = await DataBase.removeOldHomework({
							classNameOrInstance: className,
							schoolName,
						});

						const removedHomework = AllHomeworks.filter(
							({ _id }) =>
								!actualHomework.find(
									({ _id: anId }) => _id.toString() === anId.toString(),
								),
						);
						const removedHomeworkIds = removedHomework.map(({ _id }) => _id);

						if (removedHomeworkIds.length) {
							pubsub.publish(ON_HOMEWORKS_REMOVED, {
								onHomeworksRemoved: removedHomeworkIds,
							});
						}

						return actualHomework;
					} catch (e) {
						console.error(e);
						return null;
					}
				},
			});
			//? pin
			ClassTC.addResolver({
				name: 'pinHomework',
				// @ts-ignore
				type: ClassTC.get('homework').getType(),
				args: { className: 'String!', schoolName: 'String!', homeworkId: 'String!' },
				resolve: async ({ args: { className, schoolName, homeworkId } }) => {
					try {
						const res = await DataBase.togglePinHomework(
							{ classNameOrInstance: className, schoolName },
							homeworkId,
						);

						if (res) {
							const Class = await DataBase.getClassByName(className, schoolName);

							if (Class) {
								const pinnedHomework = Class.homework.find(
									({ _id }) => _id.toString() === homeworkId,
								);
								pubsub.publish(ON_HOMEWORK_CHANGED, {
									onHomeworkChanged: {
										_id: homeworkId,
										pinned: pinnedHomework.pinned,
										className,
										schoolName,
									},
								});

								return pinnedHomework;
							}
						}

						return null;
					} catch (e) {
						console.log(e);

						return null;
					}
				},
			});
			//? unpinAll
			ClassTC.addResolver({
				name: 'unpinAllHomework',
				type: 'Boolean',
				args: { className: 'String!', schoolName: 'String!' },
				resolve: async ({ args }) => {
					try {
						const res = await DataBase.unpinAllHomework(args);

						return res;
					} catch (e) {
						console.error(e);
						return false;
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
					pubsub.publish(ON_STUDENT_REMOVED_FROM_CLASS, {
						onStudentRemovedFromClass: vkId,
					});

					const Student = await DataBase.getStudentByVkId(vkId);
					const Class = Student.class;
					if (Class) {
						await DataBase.removeStudentFromClass(vkId);
					}
					await Student.remove();
					return Student.toJSON({ virtuals: true });
				},
			});
			//? Many
			StudentTC.addResolver({
				name: 'findMany',
				type: StudentTC.List.getType(),
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
					// @ts-ignore
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
					const Student = await DataBase.getStudentByVkId(vkId);
					let oldClassName;
					if (Student.class) {
						oldClassName = await DataBase.getClassBy_Id(Student.class).then(
							({ name }) => name,
						);
					}

					if (newClassName !== 'Нету') {
						pubsub.publish(ON_STUDENT_REMOVED_FROM_CLASS, {
							onStudentRemovedFromClass: vkId,
						});

						pubsub.publish(ON_STUDENT_ADDED_TO_CLASS, {
							onStudentAddedToClass: {
								student: Student,
								className: newClassName,
								schoolName,
							},
						});

						const res = await DataBase.changeClass(vkId, newClassName, schoolName);

						if (!res) {
							pubsub.publish(ON_STUDENT_REMOVED_FROM_CLASS, {
								onStudentRemovedFromClass: vkId,
							});

							if (oldClassName) {
								pubsub.publish(ON_STUDENT_ADDED_TO_CLASS, {
									onStudentAddedToClass: {
										student: Student,
										className: oldClassName,
										schoolName,
									},
								});
							}
						}
					} else {
						pubsub.publish(ON_STUDENT_REMOVED_FROM_CLASS, {
							onStudentRemovedFromClass: vkId,
						});

						await DataBase.removeStudentFromClass(vkId);
					}
					return (await DataBase.getStudentByVkId(vkId)).toJSON({ virtuals: true });
				},
			});
			//? Remove from class
			StudentTC.addResolver({
				name: 'removeStudentFromClass',
				type: 'Int!',
				args: { vkId: 'Int!' },
				resolve: async ({ args: { vkId } }) => {
					pubsub.publish(ON_STUDENT_REMOVED_FROM_CLASS, {
						onStudentRemovedFromClass: vkId,
					});
					const res = await DataBase.removeStudentFromClass(vkId);
					if (res) {
						return vkId;
					} else {
						const Student = await DataBase.getStudentByVkId(vkId);

						if (Student.class) {
							const Class = await DataBase.getClassBy_Id(Student.class);

							pubsub.publish(ON_STUDENT_ADDED_TO_CLASS, {
								onStudentAddedToClass: {
									student: Student,
									className: Class.name,
									schoolName: Class.schoolName,
								},
							});
						}

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
				type: StudentTC.List.getType(),
				args: { className: 'String', schoolName: 'String!' },
				resolve: async ({ args: { schoolName, className } }) => {
					const students = await DataBase.getStudentsFromClass(className, schoolName);

					if (students) {
						students.map((student) => student.toJSON({ virtuals: true }));
						return students;
					} else {
						return null;
					}
				},
			});
			StudentTC.addResolver({
				name: 'studentsForSchool',
				args: { schoolName: 'String' },
				type: StudentTC.List.getType(),
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
	pinHomework: ClassTC.getResolver('pinHomework'),
	unpinAllHomework: ClassTC.getResolver('unpinAllHomework'),
	removeOldHomework: ClassTC.getResolver('removeOldHomework'),
	addAnnouncement: ClassTC.getResolver('addAnnouncement'),
	removeAnnouncement: ClassTC.getResolver('removeAnnouncement'),
	updateAnnouncement: ClassTC.getResolver('updateAnnouncement'),
	removeOldAnnouncements: ClassTC.getResolver('removeOldAnnouncements'),
	pinAnouncement: ClassTC.getResolver('pinAnnouncement'),
	unpinAllAnnouncements: ClassTC.getResolver('unpinAllAnnouncements'),
});

schemaComposer.Subscription.addFields({
	onAnnouncementAdded: {
		//@ts-ignore
		type: 'announcementAdd',
		args: { className: 'String', schoolName: 'String' },
		subscribe: withFilter(
			() => pubsub.asyncIterator(ON_ANNOUNCEMENT_ADDED),
			isRightClass('onAnnouncementAdded'),
		),
	},
	onAnnouncementsRemoved: {
		type: '[String]',
		args: { className: 'String', schoolName: 'String' },
		subscribe: withFilter(
			() => pubsub.asyncIterator(ON_ANNOUNCEMENTS_REMOVED),
			async (response, variables) => {
				const announcements = await DataBase.getAnnouncements({
					classNameOrInstance: variables.className,
					schoolName: variables.schoolName,
				});

				return response.onAnnouncementsRemoved.some((id) =>
					announcements.find(({ _id }) => _id.toString() === id),
				);
			},
		),
	},
	onAnnouncementConfirmed: {
		type: 'creationConfirmation',
		args: { className: 'String', schoolName: 'String' },
		subscribe: withFilter(
			() => pubsub.asyncIterator(ON_ANNOUNCEMENT_CONFIRMED),
			isRightClass('onAnnouncementConfirmed'),
		),
	},
	onAnnouncementChanged: {
		//@ts-ignore
		type: 'announcementChange',
		args: { className: 'String', schoolName: 'String' },
		subscribe: withFilter(
			() => pubsub.asyncIterator(ON_ANNOUNCEMENT_CHANGED),
			isRightClass('onAnnouncementChanged'),
		),
	},
	onHomeworkAdded: {
		//@ts-ignore
		type: 'homeworkAdd',
		args: { className: 'String', schoolName: 'String' },
		subscribe: withFilter(
			() => pubsub.asyncIterator(ON_HOMEWORK_ADDED),
			isRightClass('onHomeworkAdded'),
		),
	},
	onHomeworksRemoved: {
		type: '[String]',
		args: { className: 'String', schoolName: 'String' },
		subscribe: withFilter(
			() => pubsub.asyncIterator(ON_HOMEWORKS_REMOVED),
			async (response, variables) => {
				const homework = await DataBase.getHomework({
					classNameOrInstance: variables.className,
					schoolName: variables.schoolName,
				});

				return response.onHomeworksRemoved.some((id) =>
					homework.find(({ _id }) => _id.toString() === id),
				);
			},
		),
	},
	onHomeworkConfirmed: {
		type: 'creationConfirmation',
		args: { className: 'String', schoolName: 'String' },
		subscribe: withFilter(
			() => pubsub.asyncIterator(ON_HOMEWORK_CONFIRMED),
			isRightClass('onHomeworkConfirmed'),
		),
	},
	onHomeworkChanged: {
		//@ts-ignore
		type: 'homeworkChange',
		args: { className: 'String', schoolName: 'String' },
		subscribe: withFilter(
			() => pubsub.asyncIterator(ON_HOMEWORK_CHANGED),
			isRightClass('onHomeworkChanged'),
		),
	},
	onScheduleChanged: {
		type: 'scheduleChange',
		args: { className: 'String', schoolName: 'String' },
		subscribe: withFilter(
			() => pubsub.asyncIterator(ON_SCHEDULE_CHANGED),
			isRightClass('onScheduleChanged'),
		),
	},
	onStudentAddedToClass: {
		type: 'studentSchoolChange',
		args: { className: 'String', schoolName: 'String' },
		subscribe: withFilter(
			() => pubsub.asyncIterator(ON_STUDENT_ADDED_TO_CLASS),
			isRightClass('onStudentAddedToClass'),
		),
	},
	onStudentRemovedFromClass: {
		type: 'Int!',
		args: { className: 'String', schoolName: 'String' },
		subscribe: withFilter(
			() => pubsub.asyncIterator(ON_STUDENT_REMOVED_FROM_CLASS),
			async (response, variables) => {
				const Class = await DataBase.getClassForStudent(response.onStudentRemovedFromClass);

				return (
					Class.schoolName === variables.schoolName && Class.name === variables.className
				);
			},
		),
	},
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
	pubsub,
	ON_ANNOUNCEMENT_ADDED,
	ON_ANNOUNCEMENTS_REMOVED,
	ON_ANNOUNCEMENT_CONFIRMED,
	ON_ANNOUNCEMENT_CHANGED,
};
