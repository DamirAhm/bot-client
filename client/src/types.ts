export enum roles {
    student = "STUDENT",
    admin = "ADMIN",
    contributor = "CONTRIBUTOR",
}
export enum redactorOptions {
    delete = "DELETE",
    change = "CHANGE",
    confirm = "CONFIRM",
    reject = "REJECT",
    add = "ADD",
    exit = "EXIT",
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
    class?: string | null;
    role: roles;
    vkId: number;
    settings: studentSettings;
    lastHomeworkCheck: string;
    fullName?: string;
    className?: string;
    schoolName: string;
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
}

export type studentSettings = {
    notificationsEnabled: boolean;
    notificationTime: string;
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
};

export type homework = {
    lesson: string;
} & content;

export type Class = {
    students: string[];
    name: string;
    homework: homework[];
    schedule: string[][];
    announcements: announcement[];
    schoolName: string;
};

export type School = {
    classes: Class[]
} & schoolPreview
export type schoolPreview = {
    _id: string;
    name: string;
}

export type announcement = content;
export type WithTypename<T> = T & { __typename: string };

export type User = {
    last_name: string;
    first_name: string;
    uid: number;
    photo: string;
    photo_rec: string;
    role: roles;
    className: string | null;
    schoolName: string | null;
};

export type setStateProp<T> = T | ((user: T) => T);


















