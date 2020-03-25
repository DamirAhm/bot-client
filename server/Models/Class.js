const mongoose = require("mongoose");
const uuid4 = require("uuid4");
const {Lessons} = require("./utils");

const classSchema = mongoose.Schema({
    students: {
        type: [{
            type: mongoose.Schema.ObjectId,
            ref: "Student"
        }],
        default: []
    },
    name: {
        type: String,
        validate: {
            validator: (name) => {
                if (/(\d)+([A-Z]|[А-Я])/.test(name)) {
                    if ((name.match(/\d/)[0] !== "0" && +name.match(/\d/)[0] <= 11 && +name.match(/\d/)[0] === ~~+name.match(/\d/)[0]) || name === "0Z") {
                        return true;
                    }
                }
                return false;
            },
            message: "Class name must match digit + letter"
        },
        required: true,
        unique: true
    },
    homework: {
        type: [
            {
                lesson: {
                    required: true,
                    type: String,
                    validate: {
                        validator: Lessons.includes,
                        message: "Lesson must be one of defined"
                    }
                },
                task: {
                    required: true,
                    type: String
                },
                to: {
                    type: Date,
                    default: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                    validate: {
                        validator: date => Date.now() - date >= 0,
                        message: "Homework 'to' can`t be in future"
                    }
                },
                attachments: String,
                createdBy: {
                    required: true,
                    type: Number,
                    validate: {
                        validator: Number.isInteger,
                        message: "Created by must be integer means vk id of user created it"
                    }
                }
            }
        ],
        default: []
    },
    schedule: {
        type:
            [
                [
                    {
                        type: String,
                        validate: {
                            validator: Lessons.includes,
                            message: "Lesson must be one of defined"
                        }
                    }
                ]
            ],
        default: [
            [], [], [],
            [], [], []
        ]
    },
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
    roleUpCodes: {
        type: [String],
        default: [],
        validate: {
            validator: (arrayOfCodes) => arrayOfCodes.every(code => uuid4.valid(code)),
            message: "All roleUp codes must be valid uuid4 codes"
        }
    }
});

module.exports.ClassModel = mongoose.model("Class", classSchema);
module.exports.ClassSchema = classSchema;