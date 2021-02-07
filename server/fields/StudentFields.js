//@ts-check
const { DataBase: DB, VK_API } = require('bot-database');
const config = require('../config.json');

const vk = new VK_API(process.env.VK_API_KEY, +config['GROUP_ID'], +config['ALBUM_ID']);
const DataBase = new DB(process.env.MONGODB_URI);

const StudentFields = {
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
					return await DataBase.getClassBy_Id(source.class).then((Class) => Class.name);
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
						//@ts-ignore
						.then((res) => res.first_name);
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
					//@ts-ignore
					const lastName = await vk.getUser(source.vkId).then((res) => res.last_name);
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
						//@ts-ignore
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
};

module.exports = StudentFields;
