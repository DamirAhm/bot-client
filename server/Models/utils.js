const Roles = {
    student: "STUDENT",
    admin: "ADMIN",
    contributor: "CONTRIBUTOR"
};
const Lessons = [
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
const checkValidTime = (str) => {
    return typeof str === "string" && (!isNaN(+str[0]) && +str[0] >= 0) && (!isNaN(+str[1]) && +str[1] >= 0) && str[2] === ":" && (!isNaN(+str[3]) && +str[3] >= 0) && (!isNaN(+str[4]) && +str[4] >= 0);
};

module.exports = {
    Roles,
    Lessons,
    checkValidTime
};