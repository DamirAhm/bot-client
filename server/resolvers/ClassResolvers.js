// @ts-check
const { withFilter } = require('apollo-server-express');
const { DataBase: DB } = require('bot-database');
const { default: ClassModel } = require('bot-database/build/Models/ClassModel');
const { ClassTC } = require('../ModelTypeComposers');

const {
	pubsub,
	ON_SCHEDULE_CHANGED,
	ON_ANNOUNCEMENT_ADDED,
	ON_ANNOUNCEMENT_CONFIRMED,
	ON_ANNOUNCEMENTS_REMOVED,
	ON_ANNOUNCEMENT_CHANGED,
	ON_HOMEWORKS_REMOVED,
	ON_HOMEWORK_ADDED,
	ON_HOMEWORK_CONFIRMED,
	ON_HOMEWORK_CHANGED,
} = require('../PubSub.js');

const DataBase = new DB(process.env.MONGODB_URI);

const isRightClass = (name) => (response, variables) =>
	response[name].schoolName === variables.schoolName &&
	response[name].className === variables.className;

const ClassResolvers = {
	Mutations: {
		//* Ovreride
		//? create
		classCreateOne: {
			name: 'classCreateOne',
			type: ClassTC.getType(),
			args: { className: 'String!', schoolName: 'String!' },
			resolve: async ({ args: { className, schoolName } }) => {
				return await DataBase.createClass(className, schoolName);
			},
		},
		//? remove
		removeOne: {
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
		},
		//? change
		changeDay: {
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
		},

		//* Announcements
		//? add
		addAnnouncement: {
			name: 'addAnnouncement',
			// @ts-ignore
			type: ClassTC.get('announcements').getType(),
			args: {
				student_id: 'Int!',
				className: 'String!',
				schoolName: 'String!',
				// @ts-ignore
				content: ClassTC.get('announcements').getInputType(),
			},
			resolve: async ({ args: { content, className, student_id, schoolName } }) => {
				try {
					if (content.attachments) {
						for (const attachment of content.attachments) {
							delete attachment._id;
						}
					}

					const stabId = Date.now().toString();
					pubsub.publish(ON_ANNOUNCEMENT_ADDED, {
						onAnnouncementAdded: {
							...content,
							student_id,
							_id: stabId,
							pinned: false,
							className,
							schoolName,
						},
					});
					const announcement_Id = await DataBase.addAnnouncement(
						{ classNameOrInstance: className, schoolName },
						content,
						new Date(content.to),
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
		},
		//? remove
		removeAnnouncement: {
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
		},
		//? change
		updateAnnouncement: {
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
		},
		//? remove old
		removeOldAnnouncements: {
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
		},
		//? pin
		pinAnnouncement: {
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
		},
		//? unpinAll
		unpinAllAnnouncements: {
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
		},

		//* Homework
		//? remove
		removeHomework: {
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
		},
		//? add
		addHomework: {
			name: 'addHomework',
			// @ts-ignore
			type: ClassTC.get('homework').getType(),
			args: {
				student_id: 'Int!',
				className: 'String!',
				schoolName: 'String!',
				//@ts-ignore
				content: ClassTC.get('homework').getInputType(),
			},
			resolve: async ({ args: { className, schoolName, student_id, content } }) => {
				if (content.attachments) {
					for (const attachment of content.attachments) {
						delete attachment._id;
					}
				}

				const stabId = Date.now().toString();
				pubsub.publish(ON_HOMEWORK_ADDED, {
					onHomeworkAdded: {
						...content,
						student_id,
						_id: stabId,
						pinned: false,
						className,
						schoolName,
					},
				});

				const homework_id = await DataBase.addHomework(
					{ classNameOrInstance: className, schoolName },
					content,
					student_id,
					content.to,
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
		},
		//? change
		updateHomework: {
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
			resolve: async ({ args, args: { className, schoolName, homeworkId, updates } }) => {
				try {
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
				} catch (e) {
					console.error(e);
					return null;
				}
			},
		},
		//? remove old
		removeOldHomework: {
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
		},
		//? pin
		pinHomework: {
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
		},
		//? unpinAll
		unpinAllHomework: {
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
		},
	},
	Queries: {
		//* Get
		//?getForSchool
		classesForSchool: {
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
		},

		//* Schedule
		//? get
		getSchedule: {
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
		},

		//* Announcements
		//? get
		getAnnouncements: {
			name: 'getAnnouncements',
			// @ts-ignore
			type: ClassTC.get('announcements').List.getType(),
			args: {
				className: 'String!',
				date: 'Date',
				schoolName: 'String!',
				requestingUserVkId: 'Int',
			},
			resolve: async ({ args: { className, schoolName, date, requestingUserVkId } }) => {
				const announcements = await DataBase.getAnnouncements(
					{ classNameOrInstance: className, schoolName },
					date,
				);

				if (announcements) {
					if (requestingUserVkId) {
						return announcements.filter(
							({ onlyFor }) =>
								onlyFor.length === 0 || onlyFor.includes(requestingUserVkId),
						);
					} else {
						return announcements;
					}
				} else {
					return [];
				}
			},
		},

		//* Homework
		//? get
		getHomework: {
			name: 'getHomework',
			// @ts-ignore
			type: ClassTC.get('homework').List.getType(),
			args: {
				className: 'String!',
				date: 'Date',
				schoolName: 'String!',
				requestingUserVkId: 'Int',
			},
			resolve: async ({ args: { className, schoolName, date, requestingUserVkId } }) => {
				const homework = await DataBase.getHomework(
					{ classNameOrInstance: className, schoolName },
					date,
				);

				if (homework) {
					if (requestingUserVkId) {
						return homework.filter(
							({ onlyFor }) =>
								onlyFor.length === 0 || onlyFor.includes(requestingUserVkId),
						);
					} else {
						return homework;
					}
				} else {
					return [];
				}
			},
		},
	},
	Subscriptions: {
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
	},
};

module.exports = ClassResolvers;
