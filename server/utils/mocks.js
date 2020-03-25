const MockStudent = {
    _id: "5e5139bc27ad7418885f089f",
    role: "STUDENT",
    isSubscribedToMailing: true,
    vkId: 0,
    __v: 0,
    class: "5e5139bc27ad7418885f089e"
};
const MockClass = {
    _id: "5e5139bc27ad7418885f089e",
    students: [
        "5e5139bc27ad7418885f089f"
    ],
    schedule: [],
    roleUpCodes: [],
    name: "10B",
    homework: [],
    changes: [],
    __v: 1
};

module.exports = {
    MockClass,
    MockStudent
}