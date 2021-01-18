"use strict";
exports.__esModule = true;
var roles;
(function (roles) {
    roles["student"] = "STUDENT";
    roles["admin"] = "ADMIN";
    roles["contributor"] = "CONTRIBUTOR";
})(roles = exports.roles || (exports.roles = {}));
var redactorOptions;
(function (redactorOptions) {
    redactorOptions["delete"] = "DELETE";
    redactorOptions["change"] = "CHANGE";
    redactorOptions["confirm"] = "CONFIRM";
    redactorOptions["reject"] = "REJECT";
    redactorOptions["add"] = "ADD";
    redactorOptions["exit"] = "EXIT";
    redactorOptions["pin"] = "PIN";
    redactorOptions["unpin"] = "UNPIN";
})(redactorOptions = exports.redactorOptions || (exports.redactorOptions = {}));
exports.lessons = [
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
exports.isOptionType = function (option) {
    return !!(option && 'value' in option && option.value);
};
