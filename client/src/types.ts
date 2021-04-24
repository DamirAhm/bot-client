import { ValueType } from 'react-select';

export enum roles {
	student = 'STUDENT',
	admin = 'ADMIN',
	contributor = 'CONTRIBUTOR',
}
export enum redactorOptions {
	delete = 'DELETE',
	change = 'CHANGE',
	confirm = 'CONFIRM',
	reject = 'REJECT',
	add = 'ADD',
	exit = 'EXIT',
	pin = 'PIN',
	settings = 'SETTINGS',
	upload = 'UPLOAD',
}

export enum changeTypes {
	content = 'CONTENT',
	userPreferences = 'USER_PREFERENCES',
}

export const lessons = [
	'Математика',
	'Английский',
	'Русский',
	'Экономика',
	'География',
	'Физика',
	'Алгебра',
	'Геометрия',
	'Литература',
	'История',
	'Обществознание',
	'Астрономия',
	'ОБЖ',
	'Информатика',
];

export type Student = {
	class?: string | null;
	role: roles;
	vkId: number;
	settings: studentSettings;
	lastHomeworkCheck: string;
	fullName?: string;
	firstName?: string;
	lastName?: string;
	className?: string;
	schoolName?: string;
	_id: string;
};
export type StudentInfoType = {
	class?: string | null;
	role: roles;
	vkId: number;
	settings: studentSettings;
	lastHomeworkCheck: string;
	fullName?: string;
	className?: string;
	schoolName: string;
};

export type studentSettings = {
	notificationsEnabled: boolean;
	notificationTime: string;
	daysForNotification: string;
};

export type attachment = {
	url: string;
	value: string;
	_id: string;
};
export type size = {
	url: string;
	width: number;
	height: number;
};
export type vkPhoto = {
	id: number;
	album_id: number;
	owner_id: number;
	user_id: number;
	text: string;
	date: number;
	sizes: size[];
};

export type content = {
	attachments: WithTypename<attachment>[];
	text: string;
	_id?: string;
	to: string;
	ceratedBy?: number;
	pinned: boolean;
	onlyFor: number[];
};
export type changeableInContent = Pick<content, 'text' | 'attachments' | 'to' | 'onlyFor'>;

export type userPreferences = {
	notificationTime: string | null;
	daysForNotification: number[] | null;
	notificationEnabled: boolean | null;
};
export type homework = {
	lesson: string;
	userPreferences: {
		[studentVkId: string]: userPreferences | undefined;
	};
} & content;
export type changeableInHomework = Pick<
	homework,
	'lesson' | 'text' | 'attachments' | 'to' | 'onlyFor'
>;

export type Class = {
	students: string[];
	name: string;
	homework: homework[];
	schedule: string[][];
	announcements: announcement[];
	schoolName: string;
};

export type optionType<Value = string> = {
	value: Value;
	label: string;
};

export const isOptionType = (option: ValueType<optionType, false>): option is optionType => {
	return !!(option && 'value' in option && option.value);
};

export type School = {
	classes: Class[];
	callSchedule: callSchedule;
} & schoolPreview;
export type callSchedule = {
	defaultSchedule: lessonCalls[];
	exceptions: lessonCalls[][];
};
export type lessonCalls = {
	start: string;
	end: string;
};
export type schoolPreview = {
	_id: string;
	name: string;
	city: string;
	number: string;
};

export type announcement = content;
export type changableInAnnouncement = changeableInContent;

export type WithTypename<T> = T & { __typename: string };

export type User = {
	last_name: string;
	first_name: string;
	uid: number;
	photo: string;
	photo_rec: string;
	role: roles;
} & Student;

export type setStateProp<T> = T | ((user: T) => T);
