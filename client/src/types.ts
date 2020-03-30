export enum roles {
    student = "STUDENT",
    admin = "ADMIN",
    contributor = "CONTRIBUTOR"
}
export const lessons = [
    "Математика",
    "Английский",
    "Русский",
    "Экономика",
    "География",
    "Физика",
    "Алгебра",
    "Геометрия",
    "Литература",
    "История",
    "Обществознание",
    "Астрономия",
    "ОБЖ",
    "Информатика",
];

export type Student = {
    class: string,
    role: roles,
    vkId: number,
    settings: {
        notificationsEnabled: boolean,
        notificationTime: string,
    },
    lastHomeworkCheck: string,
    banned: boolean,
    fullName: string,
    className: string
}

export type homework = {
    lesson: string,
    task: string,
    to: Date,
    attachments: string,
    createdBy: number
}

export type Class = {
    students: string[],
    name: string,
    homework: homework[],
    schedule: string[][],
    changes: {
        type: [{
            text: String,
            attachments: String,
            to: Date,
            createdBy: Number,
            _id: false
        }],
        default: []
    },
    roleUpCodes: string[]
    fullName: string
}