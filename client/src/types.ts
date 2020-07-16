export enum roles {
  student = "STUDENT",
  admin = "ADMIN",
  contributor = "CONTRIBUTOR",
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
  class: string;
  role: roles;
  vkId: number;
  settings: studentSettings;
  lastHomeworkCheck: string;
  banned: boolean;
  fullName: string;
  className: string;
  _id: string;
};

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
  changes: change[];
  roleUpCodes: string[];
  fullName: string;
};

export type change = content;
export type WithTypename<T> = T & { __typename: string };
