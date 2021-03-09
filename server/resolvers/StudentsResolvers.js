// @ts-check
const { withFilter } = require('apollo-server-express');
const { DataBase: DB, VK_API } = require('bot-database');
const { StudentTC } = require('../ModelTypeComposers');
const config = require('../config.json');
const { pubsub, ON_STUDENT_REMOVED_FROM_CLASS, ON_STUDENT_ADDED_TO_CLASS } = require('../PubSub');

const vk = new VK_API(process.env.VK_API_KEY, +config['GROUP_ID'], +config['ALBUM_ID']);
const DataBase = new DB(process.env.MONGODB_URI);

const isRightClass = (name) => (response, variables) =>
	response[name].schoolName === variables.schoolName &&
	response[name].className === variables.className;

const StudentResolvers = {
	Mutations: {
		//* Ovreride
		//? Remove
		studentRemoveOne: {
			name: 'studentRemoveOne',
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
		},

		//* Settings

		//? Change
		changeSettings: {
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
		},

		//* Actions
		//? Change class
		changeClass: {
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
		},
		//? Remove from class
		removeStudentFromClass: {
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
		},
	},
	Queries: {
		//* Getters
		//? Get for class
		studentsForClass: {
			name: 'studentsForClass',
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
		},
		//? Gets student that studying in exact school
		studentsForSchool: {
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
		},
		studentByVkId: {
			name: 'studentByVkId',
			type: StudentTC.getType(),
			args: { vkId: 'Int!' },
			resolve: async ({ args: { vkId } }) => {
				if (vkId) {
					let Student = await DataBase.getStudentByVkId(vkId);

					if (!Student) {
						const { first_name, last_name } = await vk.getUser(vkId);

						Student = await DataBase.createStudent(vkId, {
							class_id: null,
							firstName: first_name,
							lastName: last_name,
							registered: false,
							schoolName: null,
						});
					}
					console.log(Student);
					return Student;
				} else {
					return null;
				}
			},
		},
	},
	Subscriptions: {
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
					const Class = await DataBase.getClassForStudent(
						response.onStudentRemovedFromClass,
					);

					return (
						Class.schoolName === variables.schoolName &&
						Class.name === variables.className
					);
				},
			),
		},
	},
};

module.exports = StudentResolvers;
