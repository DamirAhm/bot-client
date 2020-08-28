// @ts-nocheck
const { composeWithMongoose } = require( "graphql-compose-mongoose" );
const { schemaComposer } = require( "graphql-compose" );
const StudentModel = require( "bot-database/Models/StudentModel" );
const ClassModel = require( "bot-database/Models/ClassModel" );
const { DataBase: DB, Roles, Lessons, VK_API } = require( "bot-database" );
const config = require( "./config.json" );

const DataBase = new DB( config[ "MONGODB_URI" ] );
const vk = new VK_API( config[ "VK_API_KEY" ] );

const customizationOptions = {};
const StudentTC = composeWithMongoose( StudentModel, customizationOptions );
const ClassTC = composeWithMongoose( ClassModel, customizationOptions );

//Resolvers
{
    //! Classes
    {
        //* Ovreride
        {
            //? create
            ClassTC.addResolver( {
                name: "classCreateOne",
                type: ClassTC.getType(),
                args: { className: "String!" },
                resolve: async ( { source, args, context, info } ) => {
                    return await DataBase.createClass( args.className );
                },
            } );
            //? remove
            ClassTC.addResolver( {
                name: "removeOne",
                type: ClassTC.getType(),
                args: { className: "String!" },
                resolve: async ( { source, args, context, info } ) => {
                    const Class = await DataBase.getClassByName( args.className );
                    const students = Class.students;
                    if ( students.length > 0 ) {
                        for ( let student of students ) {
                            const Student = await DataBase.getStudentBy_Id(
                                student
                            );
                            await Student.updateOne( { class: null } );
                        }
                    }
                    await Class.deleteOne();
                    return Class;
                },
            } );
        }
        //* Properties
        {
            //? name
            ClassTC.addResolver( {
                name: "name",
                type: "String",
                args: { class_id: "String!" },
                resolve: async ( { source, args, context, info } ) => {
                    if ( args.class_id ) {
                        const Class = await DataBase.getClassBy_Id(
                            args.class_id
                        );
                        if ( Class !== null ) {
                            return Class.name;
                        } else {
                            return "Неверное имя класса";
                        }
                    } else {
                        return "Нету";
                    }
                },
            } );
        }
        //* Schedule
        {
            //? get
            ClassTC.addResolver( {
                name: "getSchedule",
                type: "[ [ String ] ]",
                args: { className: "String!" },
                resolve: async ( { source, args, context, info } ) => {
                    const Class = await DataBase.getClassByName( args.className );
                    return Class.schedule;
                },
            } );
            //? change
            ClassTC.addResolver( {
                name: "changeDay",
                type: ClassTC.getType(),
                args: {
                    className: "String!",
                    dayIndex: "Int!",
                    newSchedule: "[String]!",
                },
                resolve: async ( { source, args, context, info } ) => {
                    await DataBase.changeDay(
                        args.className,
                        args.dayIndex,
                        args.newSchedule
                    );
                    return await DataBase.getClassByName( args.className );
                },
            } );
        }
        //* Changes
        {
            //? get
            ClassTC.addResolver( {
                name: "getChanges",
                type: `[${ClassTC.get( "changes" ).getType()}]`,
                args: { className: "String!", date: "Date" },
                resolve: async ( { source, args, context, info } ) => {
                    return await DataBase.getChanges( args.className, args.date );
                },
            } );
            //? add
            ClassTC.addResolver( {
                name: "addChange",
                type: ClassTC.get( "changes" ).getType(),
                args: {
                    student_id: "Int!",
                    className: "String!",
                    text: "String!",
                    to: "String",
                    attachments: `[${ClassTC.get(
                        "homework.attachments"
                    ).getInputType()}]!`,
                },
                resolve: async ( {
                    source,
                    args: { attachments, text, to, className, student_id },
                } ) => {
                    try {
                        if ( attachments ) {
                            for ( const attachment of attachments ) {
                                delete attachment._id;
                            }
                        }

                        const change = await DataBase.addChanges(
                            className,
                            { attachments, text },
                            to,
                            false,
                            student_id
                        );
                        if ( change ) {
                            return await DataBase.getClassByName(
                                className
                            ).then( ( c ) =>
                                c.changes.find(
                                    ( ch ) =>
                                        ch._id.toString() === change.toString()
                                )
                            );
                        } else {
                            return null;
                        }
                    } catch ( e ) {
                        console.error( e );
                    }
                    return { attachments, text, to, className, _id: "123122" };
                },
            } );
            //? remove
            ClassTC.addResolver( {
                name: "removeChange",
                type: "String",
                args: { className: "String!", changeId: "String!" },
                resolve: async ( { source, args } ) => {
                    const result = await DataBase.removeChanges(
                        args.className,
                        args.changeId
                    );
                    if ( result ) {
                        return args.changeId;
                    }
                    return null;
                },
            } );
            //? change
            ClassTC.addResolver( {
                name: "updateChange",
                type: ClassTC.get( "changes" ).getType(),
                args: {
                    className: "String!",
                    changeId: "String!",
                    updates: `${ClassTC.get( "changes" ).getInputType()}!`,
                },
                resolve: async ( { source, args, context, info } ) => {
                    const {
                        updates: { attachments },
                    } = args;
                    if ( attachments ) {
                        for ( const attachment of attachments ) {
                            delete attachment._id;
                        }
                    }
                    const updatedChange = await DataBase.updateChange(
                        args.className,
                        args.changeId,
                        args.updates
                    );
                    if ( updatedChange ) {
                        return updatedChange.find(
                            ( e ) => e._id.toString() === args.changeId
                        );
                    } else {
                        return null;
                    }
                },
            } );
            ClassTC.addResolver( {
                name: "removeOldChanges",
                type: `[${ClassTC.get( "changes" ).getType()}]`,
                args: { className: "String!" },
                resolve: async ( { _, args: { className } } ) => {
                    try {
                        const actualChanges = await DataBase.removeOldChanges(
                            className
                        );

                        return actualChanges;
                    } catch ( e ) {
                        console.error( e );
                        return null;
                    }
                },
            } );
        }
        //* Homework
        {
            //? get
            ClassTC.addResolver( {
                name: "getHomework",
                type: `[${ClassTC.get( "homework" ).getType()}]`,
                args: { className: "String!", date: "Date" },
                resolve: async ( { source, args, context, info } ) => {
                    return (
                        ( await DataBase.getHomework(
                            args.className,
                            args.date
                        ) ) || []
                    );
                },
            } );
            //? remove
            ClassTC.addResolver( {
                name: "removeHomework",
                type: "String",
                args: { className: "String!", homeworkId: "String!" },
                resolve: async ( { source, args, context, info } ) => {
                    await DataBase.removeHomework(
                        args.className,
                        args.homeworkId
                    );
                    return args.homeworkId;
                },
            } );
            //TODO replace return of addHomework from _id to object
            //? add
            ClassTC.addResolver( {
                name: "addHomework",
                type: ClassTC.get( "homework" ).getType(),
                args: {
                    student_id: "Int!",
                    className: "String!",
                    text: "String!",
                    to: "String",
                    lesson: "String!",
                    attachments: `[${ClassTC.get(
                        "homework.attachments"
                    ).getInputType()}]!`,
                }, //TODO think about attachments
                resolve: async ( { source, args } ) => {
                    if ( args.attachments ) {
                        for ( const attachment of args.attachments ) {
                            delete attachment._id;
                        }
                    }
                    const id = await DataBase.addHomework(
                        args.className,
                        args.lesson,
                        { text: args.text, attachments: args.attachments },
                        args.student_id,
                        args.to
                    );
                    if ( id ) {
                        const hw = await DataBase.getClassByName(
                            args.className
                        ).then( ( cl ) =>
                            cl.homework.find(
                                ( e ) => e._id.toString() === id.toString()
                            )
                        );

                        return hw;
                    }
                    return null;
                },
            } );
            //? change
            ClassTC.addResolver( {
                name: "updateHomework",
                type: ClassTC.get( "homework" ).getType(),
                args: {
                    className: "String!",
                    homeworkId: "String!",
                    updates: ClassTC.get( "homework" ).getInputType(),
                },
                resolve: async ( { source, args, context, info } ) => {
                    const Class = await DataBase.getClassByName( args.className );
                    if (
                        Class.homework.find(
                            ( e ) =>
                                e._id.toString() === args.homeworkId.toString()
                        )
                    ) {
                        if ( args.updates.attachments ) {
                            for ( const attachment of args.updates.attachments ) {
                                delete attachment._id;
                            }
                        }
                        const updatedHomework = await DataBase.updateHomework(
                            args.className,
                            args.homeworkId,
                            { ...args.updates }
                        );

                        return updatedHomework.find(
                            ( e ) =>
                                e._id.toString() === args.homeworkId.toString()
                        );
                    } else {
                        return null;
                    }
                },
            } );
            //? remove old
            ClassTC.addResolver( {
                name: "removeOldHomework",
                type: `[${ClassTC.get( "homework" ).getType()}]`,
                args: { className: "String!" },
                resolve: async ( { _, args: { className } } ) => {
                    try {
                        const actualHomework = await DataBase.removeOldHomework(
                            className
                        );

                        return actualHomework;
                    } catch ( e ) {
                        console.error( e );
                        return null;
                    }
                },
            } );
        }
    }

    //! Students
    {
        //* Ovreride
        {
            //? Remove
            StudentTC.addResolver( {
                name: "removeOne",
                type: StudentTC.getType(),
                args: { vkId: "Int!" },
                resolve: async ( { source, args, context, info } ) => {
                    const Student = await DataBase.getStudentByVkId( args.vkId );
                    const Class = Student.class;
                    if ( Class ) {
                        await DataBase.removeStudentFromClass( args.vkId );
                    }
                    await Student.deleteOne();
                    return Student;
                },
            } );
            //? Create
            StudentTC.addResolver( {
                name: "studentCreateOne",
                type: StudentTC.getType(),
                args: { vkId: "Int!" },
                resolve: async ( { source, args, context, info } ) => {
                    return await DataBase.createStudent( args.vkId );
                },
            } );
        }
        //* Properties
        {
            //? First name
            StudentTC.addResolver( {
                name: "firstName",
                type: "String",
                args: { vkId: "String!" },
                resolve: async ( { source, args, context, info } ) => {
                    const student = await DataBase.getStudentByVkId( args.vkId );
                    if ( student && student.firstName ) {
                        return student.firstName;
                    } else if ( student ) {
                        const firstName = await vk
                            .getUser( args.vkId )
                            .then( ( res ) => res[ 0 ].first_name );
                        student.firstName = firstName;
                        student.save();
                        return firstName;
                    } else {
                        return null;
                    }
                },
            } );
            //? Second name
            StudentTC.addResolver( {
                name: "secondName",
                type: "String",
                args: { vkId: "String!" },
                resolve: async ( { source, args, context, info } ) => {
                    const student = await DataBase.getStudentByVkId( args.vkId );
                    if ( student && student.secondName ) {
                        return student.secondName;
                    } else if ( student ) {
                        const secondName = await vk
                            .getUser( args.vkId )
                            .then( ( res ) => res[ 0 ].last_name );
                        student.lastName = secondName;
                        student.save();
                        return secondName;
                    } else {
                        return null;
                    }
                },
            } );
            //? Full name
            StudentTC.addResolver( {
                name: "fullName",
                type: "String",
                args: { vkId: "String!" },
                resolve: async ( { source, args, context, info } ) => {
                    const student = await DataBase.getStudentByVkId( args.vkId );
                    if ( student && student.fullName ) {
                        return student.fullName;
                    } else if ( student ) {
                        const fullName = await vk
                            .getUser( args.vkId )
                            .then( ( res ) => res[ 0 ] )
                            .then(
                                ( res ) => res.first_name + " " + res.last_name
                            );
                        student.fullName = fullName;
                        student.save();
                        return fullName;
                    } else {
                        return null;
                    }
                },
            } );
        }
        //* Settings
        {
            //? Change
            StudentTC.addResolver( {
                name: "changeSettings",
                type: "Boolean",
                args: {
                    vkId: "Int!",
                    diffObject: StudentTC.get( "settings" ).getInputType(),
                },
                resolve: async ( { source, args, context, info } ) => {
                    return await DataBase.changeSettings(
                        args.vkId,
                        args.diffObject
                    );
                },
            } );
        }
        //* Actions
        {
            //? Change class
            StudentTC.addResolver( {
                name: "changeClass",
                type: StudentTC.getType(),
                args: { vkId: "Int!", newClassName: "String!" },
                resolve: async ( { source, args, context, info } ) => {
                    if ( args.newClassName !== "Нету" ) {
                        await DataBase.changeClass(
                            args.vkId,
                            args.newClassName
                        );
                    } else {
                        await DataBase.removeStudentFromClass( args.vkId );
                    }
                    return await DataBase.getStudentByVkId( args.vkId );
                },
            } );
            //? Remove from class
            StudentTC.addResolver( {
                name: "removeStudentFromClass",
                type: "Boolean",
                args: { vkId: "Int!" },
                resolve: async ( { source, args, context, info } ) => {
                    return await DataBase.removeStudentFromClass( args.vkId );
                },
            } );
        }
        //* Getters
        {
            //? Get for class
            StudentTC.addResolver( {
                name: "getForClass",
                type: "[Student]",
                args: { className: "String" },
                resolve: async ( { source, args, context, info } ) => {
                    const Class = await DataBase.getClassByName( args.className );
                    return await StudentModel.find( {
                        _id: { $in: Class.students },
                    } );
                },
            } );
        }
    }

    //! Common
    {
        //? lessons
        ClassTC.addResolver( {
            name: "lessons",
            type: "[String]",
            args: {},
            resolve: async ( { source, args, context, info } ) => {
                return Lessons;
            },
        } );
        StudentTC.addResolver( {
            name: "roles",
            type: "[String]",
            args: {},
            resolve: async ( { source, args, context, info } ) => {
                return Object.values( Roles );
            },
        } );
    }
}

//Relations
{
    //! Classes
    {
        StudentTC.addRelation( "class", {
            resolver: () => ClassTC.getResolver( "findById" ),
            prepareArgs: {
                // resolver `findByIds` has `_ids` arg, let provide value to it
                _id: ( source ) => source.class,
            },
            projection: { class: 1 }, // point fields in source object, which should be fetched from DB
        } );
        ClassTC.addRelation( "students", {
            resolver: () => StudentTC.getResolver( "findByIds" ),
            prepareArgs: {
                // resolver `findByIds` has `_ids` arg, let provide value to it
                _ids: ( source ) => source.students,
            },
            projection: { class: 1 }, // point fields in source object, which should be fetched from DB
        } );
        ClassTC.addRelation( "studentsCount", {
            resolver: () => StudentTC.getResolver( "count" ),
            prepareArgs: {
                filter: ( source ) => ( { class: source._id } ),
            },
            projection: { _id: 1 },
        } );
    }
    //! Students
    {
        StudentTC.addRelation( "firstName", {
            resolver: () => StudentTC.getResolver( "firstName" ),
            prepareArgs: {
                // resolver `findByIds` has `_ids` arg, let provide value to it
                vkId: ( source ) => source.vkId,
            },
            projection: { vkId: 1 }, // point fields in source object, which should be fetched from DB
        } );
        StudentTC.addRelation( "secondName", {
            resolver: () => StudentTC.getResolver( "secondName" ),
            prepareArgs: {
                // resolver `findByIds` has `_ids` arg, let provide value to it
                vkId: ( source ) => source.vkId,
            },
            projection: { vkId: 1 }, // point fields in source object, which should be fetched from DB
        } );
        StudentTC.addRelation( "fullName", {
            resolver: () => StudentTC.getResolver( "fullName" ),
            prepareArgs: {
                // resolver `findByIds` has `_ids` arg, let provide value to it
                vkId: ( source ) => source.vkId,
            },
            projection: { vkId: 1 }, // point fields in source object, which should be fetched from DB
        } );
        StudentTC.addRelation( "className", {
            resolver: () => ClassTC.getResolver( "name" ),
            prepareArgs: {
                class_id: ( source ) => source.class,
            },
            projection: { class: 1 },
        } );
    }
}

schemaComposer.Query.addFields( {
    studentById: StudentTC.getResolver( "findById" ),
    studentByIds: StudentTC.getResolver( "findByIds" ),
    studentOne: StudentTC.getResolver( "findOne" ),
    studentMany: StudentTC.getResolver( "findMany" ),
    studentCount: StudentTC.getResolver( "count" ),
    studentConnection: StudentTC.getResolver( "connection" ),
    studentPagination: StudentTC.getResolver( "pagination" ),
    classById: ClassTC.getResolver( "findById" ),
    classByIds: ClassTC.getResolver( "findByIds" ),
    classOne: ClassTC.getResolver( "findOne" ),
    classMany: ClassTC.getResolver( "findMany" ),
    classCount: ClassTC.getResolver( "count" ),
    classConnection: ClassTC.getResolver( "connection" ),
    classPagination: ClassTC.getResolver( "pagination" ),
    getHomework: ClassTC.getResolver( "getHomework" ),
    getChanges: ClassTC.getResolver( "getChanges" ),
    getLessons: ClassTC.getResolver( "lessons" ),
    getRoles: StudentTC.getResolver( "roles" ),
    studentsForClass: StudentTC.getResolver( "getForClass" ),
    getSchedule: ClassTC.getResolver( "getSchedule" ),
} );
schemaComposer.Mutation.addFields( {
    studentCreateOne: StudentTC.getResolver( "studentCreateOne" ),
    studentCreateMany: StudentTC.getResolver( "createMany" ),
    studentUpdateById: StudentTC.getResolver( "updateById" ),
    studentUpdateOne: StudentTC.getResolver( "updateOne" ),
    studentUpdateMany: StudentTC.getResolver( "updateMany" ),
    studentRemoveById: StudentTC.getResolver( "removeById" ),
    studentRemoveOne: StudentTC.getResolver( "removeOne" ),
    studentRemoveMany: StudentTC.getResolver( "removeMany" ),
    classCreateOne: ClassTC.getResolver( "classCreateOne" ),
    classCreateMany: ClassTC.getResolver( "createMany" ),
    classUpdateById: ClassTC.getResolver( "updateById" ),
    classUpdateOne: ClassTC.getResolver( "updateOne" ),
    classUpdateMany: ClassTC.getResolver( "updateMany" ),
    classRemoveById: ClassTC.getResolver( "removeById" ),
    classRemoveOne: ClassTC.getResolver( "removeOne" ),
    classRemoveMany: ClassTC.getResolver( "removeMany" ),
    changeDay: ClassTC.getResolver( "changeDay" ),
    changeSettings: StudentTC.getResolver( "changeSettings" ),
    removeStudentFromClass: StudentTC.getResolver( "removeStudentFromClass" ),
    changeClass: StudentTC.getResolver( "changeClass" ),
    addHomework: ClassTC.getResolver( "addHomework" ),
    removeHomework: ClassTC.getResolver( "removeHomework" ),
    updateHomework: ClassTC.getResolver( "updateHomework" ),
    addChange: ClassTC.getResolver( "addChange" ),
    removeChange: ClassTC.getResolver( "removeChange" ),
    updateChange: ClassTC.getResolver( "updateChange" ),
    removeOldChanges: ClassTC.getResolver( "removeOldChanges" ),
    removeOldHomework: ClassTC.getResolver( "removeOldHomework" ),
} );

const graphqlSchema = schemaComposer.buildSchema();

module.exports = {
    graphqlSchema,
};
