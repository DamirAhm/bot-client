const {Roles, Lessons} = require("./Models/utils");

const {StudentModel: _Student} = require("./Models/Student");
const {ClassModel: _Class} = require("./Models/Class");
const uuid4 = require("uuid4");
const {
    isObjectId,
    findNextDayWithLesson,
    findNextLessonDate,
    findNotifiedStudents,
    lessonsIndexesToLessonsNames,
    checkIsToday
} = require("./utils/functions");
const mongoose = require("mongoose");
const config = require("config");

//TODO Replace returns of false and null to errors or error codes
class DataBase {
    //Getters
    static async getStudentByVkId(vkId) {
        try {
            if (vkId !== undefined && typeof vkId === "number") {
                const Student = await _Student.findOne({vkId});
                if (Student) {
                    return Student;
                } else {
                    return null;
                }
            } else {
                throw new TypeError("VkId must be number");
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            return null;
        }
    }; //Возвращает ученика по его id из vk
    static async getStudentBy_Id(_id) {
        try {
            if (typeof _id === "object" && isObjectId(_id)) _id = _id.toString();
            if (_id && typeof _id === "string") {
                const Student = await _Student.findById(_id);
                if (Student) {
                    return Student;
                } else {
                    return null;
                }
            } else {
                throw new TypeError("_id must be string");
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            return null;
        }
    }; //Возвращает ученика по его _id (это чисто для разработки (так быстрее ищется))
    static async getClassByName(name) {
        try {
            if (name && typeof name === "string") {
                const Class = await _Class.findOne({name});
                if (Class) {
                    return Class;
                } else {
                    return null;
                }
            } else {
                throw new TypeError("name must be string");
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            return null;
        }
    }; //Возвращает класс по его имени
    static async getClassBy_Id(_id) {
        try {
            if (typeof _id === "object" && isObjectId(_id)) _id = _id.toString();
            if (_id && typeof _id === "string") {
                const Class = await _Class.findById(_id);
                if (Class) {
                    return Class;
                } else {
                    return null;
                }
            } else {
                throw new TypeError("_id must be string");
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            return null;
        }
    }; //Возвращает ученика по его _id (это чисто для разработки (так быстрее ищется))

    //// Classes

    //Homework
    static async getHomework(className, date) {
        try {
            if (className && typeof className === "string") {
                const Class = await this.getClassByName(className);
                if (Class) {
                    if (date) {
                        return Class.homework.filter(({to}) => checkIsToday(date, to));
                    } else {
                        return Class.homework;
                    }
                } else {
                    return null;
                }
            } else {
                throw new TypeError("ClassName must be string")
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            console.log(e);
            return null
        }
    }; //

    //Schedule
    static async changeDay(className, dayIndex, newDay) {
        try {
            if (className && typeof className === "string") {
                if (dayIndex !== undefined && typeof dayIndex === "number" && dayIndex < 6 && dayIndex >= 0) {
                    if (newDay && Array.isArray(newDay) && newDay.every(lesson => typeof lesson === "string" && Lessons.includes(lesson))) {
                        const Class = await this.getClassByName(className);
                        if (Class) {
                            const schedule = [...Class.schedule];
                            schedule[dayIndex] = newDay;
                            await Class.updateOne({schedule});
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        throw new TypeError("new day must be array of lessons");
                    }
                } else {
                    throw new TypeError("day index must be number less than 6 and greater or eq 0")
                }
            } else {
                throw new TypeError("Class name must be string")
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            console.log(e);
            return false;
        }
    }

    //Changes
    static async getChanges(className, date) {
        try {
            if (className && typeof className === "string") {
                const Class = await this.getClassByName(className);
                if (Class) {
                    if (date) {
                        return Class.changes.filter(ch => checkIsToday(ch.to, date))
                    } else {
                        return Class.changes;
                    }
                } else {
                    return null;
                }
            } else {
                throw new TypeError("ClassName must be string")
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            return null;
        }
    }; //

    //// Students

    //Settings
    static async changeSettings(vkId, diffObject) {
        try {
            if (vkId && typeof vkId === "number") {
                if (typeof diffObject === "object" && diffObject !== null) {
                    const Student = await this.getStudentByVkId(vkId);
                    if (Student) {
                        let settings = Student.settings;
                        for (const key in diffObject) {
                            if (key in settings) {
                                settings[key] = diffObject[key];
                            }
                        }
                        await Student.updateOne({settings});
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    throw new TypeError("Second parameter must be an object of diffs in object")
                }
            } else {
                throw new TypeError("VkId must be type of number")
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            console.log(e);
            return false;
        }
    };//
    static async banUser(vkId, isBan = true) {
        try {
            if (vkId && typeof vkId === "number") {
                if (typeof isBan === "boolean") {
                    const Student = await this.getStudentByVkId(vkId);
                    if (Student) {
                        await Student.updateOne({banned: isBan});
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    throw new TypeError("isBan param must be boolean")
                }
            } else {
                throw new TypeError("VkId must be a number")
            }
        } catch (e) {
            if (e instanceof TypeError) throw e;
            return false;
        }
    }; //

    //// Interactions
    static async removeStudentFromClass(StudentVkId) {
        try {
            const Student = await DataBase.getStudentByVkId(StudentVkId);
            if (Student) {
                const Class = await this.getClassBy_Id(Student.class);
                if (!Class) return true;
                await Class.updateOne({students: Class.students.filter(({_id}) => _id.toString() !== Student._id.toString())});
                await Student.updateOne({class: null});
                return true;
            } else {
                return false;
            }
        } catch (e) {
            console.error(e);
            return false;
        }
    }; //Удаляет ученика из класса
    static async changeClass(StudentVkId, newClassName) {
        try {
            const Student = await this.getStudentByVkId(StudentVkId);
            const newClass = await this.getClassByName(newClassName);
            if (Student.class) {
                const Class = await this.getClassBy_Id(Student.class);
                if (newClass) {
                    if (Class.name !== newClassName) {
                        if (newClass && Student) {
                            const removed = await this.removeStudentFromClass(StudentVkId);
                            if (removed) {
                                await Student.updateOne({class: newClass._id});
                                await newClass.updateOne({students: [...newClass.students, Student._id]});
                                return true;
                            } else {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                await Student.updateOne({class: newClass._id});
                await newClass.updateOne({students: [...newClass.students, Student._id]});
                return true;
            }

        } catch (e) {
            if (e instanceof TypeError) throw e;
            console.log(e);
            return false;
        }
    }; //Меняет класс ученика
}

module.exports.DataBase = DataBase;

