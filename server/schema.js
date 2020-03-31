const { Roles, Lessons } = require( "./Models/utils" );
const { gql } = require( 'apollo-server-express' );
const { composeWithMongoose } = require( 'graphql-compose-mongoose' );
const { schemaComposer } = require( 'graphql-compose' );
const { StudentModel } = require( "./Models/Student" );
const { ClassModel } = require( "./Models/Class" );
const { DataBase } = require( "./DataBase" );
const { createVkApi } = require( "./utils/functions" );
const https = require( "https" );

const vk = createVkApi( "0c44f72c9eb8568cdc477605a807a03b5f924e7cf0a18121eff5b8ba1b886f3789496034c2cc75bc83924" );

const customizationOptions = {};

const StudentTC = composeWithMongoose( StudentModel, customizationOptions );
const ClassTC = composeWithMongoose( ClassModel, customizationOptions );

ClassTC.addResolver( {
    name: "getHomework",
    type: ClassTC.get( "homework" ).getType(),
    args: { className: "String!", date: "Date" },
    resolve: async ( { source, args, context, info } ) => {
        const result = await DataBase.getHomework( args.className, args.date );
        return { result };
    }
} );
ClassTC.addResolver( {
    name: "changeDay",
    type: "Boolean",
    args: { className: "String!", dayIndex: "Int", day: "[String]" },
    resolve: async ( { source, args, context, info } ) => {
        return await DataBase.changeDay( args.className, args.dayIndex, args.day );
    }
} );
ClassTC.addResolver( {
    name: "getChanges",
    type: ClassTC.get( "changes" ).getType(),
    args: { className: "String!", date: "Date" },
    resolve: async ( { source, args, context, info } ) => {
        return await DataBase.getChanges( args.className, args.date );
    }
} );
ClassTC.addResolver( {
    name: "classCreateOne",
    type: ClassTC.getType(),
    args: { className: "String!" },
    resolve: async ( { source, args, context, info } ) => {
        return await DataBase.createClass( args.className );
    }
} );
ClassTC.addResolver( {
    name: "removeOne",
    type: ClassTC.getType(),
    args: { className: "String!" },
    resolve: async ( { source, args, context, info } ) => {
        const Class = await DataBase.getClassByName( args.className );
        const students = Class.students;
        if ( students.length > 0 ) {
            for ( let student of students ) {
                const Student = await DataBase.getStudentBy_Id( student );
                await Student.updateOne( { class: null } );
            }
        }
        await Class.deleteOne();
        return Class;
    }
} );
ClassTC.addResolver( {
    name: "name",
    type: "String",
    args: { class_id: "String!" },
    resolve: async ( { source, args, context, info } ) => {
        const Class = await DataBase.getClassBy_Id( args.class_id );
        return Class.name;
    }
} );
ClassTC.addResolver( {
    name: "lessons",
    type: "[String]",
    args: {},
    resolve: async ( { source, args, context, info } ) => {
        return Lessons;
    }
} );
StudentTC.addResolver( {
    name: "changeSettings",
    type: "Boolean",
    args: { vkId: "Int!", diffObject: StudentTC.get( "settings" ).getInputType() },
    resolve: async ( { source, args, context, info } ) => {
        return await DataBase.changeSettings( args.vkId, args.diffObject );
    }
} );
StudentTC.addResolver( {
    name: "removeStudentFromClass",
    type: "Boolean",
    args: { vkId: "Int!" },
    resolve: async ( { source, args, context, info } ) => {
        return await DataBase.removeStudentFromClass( args.vkId );
    }
} );
StudentTC.addResolver( {
    name: "changeClass",
    type: StudentTC.getType(),
    args: { vkId: "Int!", newClassName: "String!" },
    resolve: async ( { source, args, context, info } ) => {
        if ( args.newClassName !== "Нету" ) {
            await DataBase.changeClass( args.vkId, args.newClassName );
        } else {
            await DataBase.removeStudentFromClass( args.vkId )
        }
        return await DataBase.getStudentByVkId( args.vkId )
    }
} );
StudentTC.addResolver( {
    name: "banStudent",
    type: StudentTC.getType(),
    args: { vkId: "Int!", isBan: "Boolean" },
    resolve: async ( { source, args, context, info } ) => {
        const result = await DataBase.banUser( args.vkId, args.isBan !== undefined ? args.isBan : true );
        if ( result ) {
            return await DataBase.getStudentByVkId( args.vkId );
        } else {
            return null;
        }
    }
} );
StudentTC.addResolver( {
    name: "studentCreateOne",
    type: StudentTC.getType(),
    args: { vkId: "Int!" },
    resolve: async ( { source, args, context, info } ) => {
        return await DataBase.createStudent( args.vkId );
    }
} );
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
    }
} );
StudentTC.addResolver( {
    name: "roles",
    type: '[String]',
    args: {},
    resolve: async ( { source, args, context, info } ) => {
        return Object.values( Roles );
    }
} );
StudentTC.addResolver( {
    name: "firstName",
    type: 'String',
    args: { vkId: "String!" },
    resolve: async ( { source, args, context, info } ) => {
        return await vk( "users.get", { user_ids: args.vkId } ).then( res => res[ 0 ].first_name );
    }
} );
StudentTC.addResolver( {
    name: "secondName",
    type: 'String',
    args: { vkId: "String!" },
    resolve: async ( { source, args, context, info } ) => {
        return await vk( "users.get", { user_ids: args.vkId } ).then( res => res[ 0 ].last_name );
    }
} );
StudentTC.addResolver( {
    name: "fullName",
    type: 'String',
    args: { vkId: "String!" },
    resolve: async ( { source, args, context, info } ) => {
        return await vk( "users.get", { user_ids: args.vkId } ).then( res => res[ 0 ] ).then( res => res.first_name + " " + res.last_name );
    }
} );

StudentTC.addRelation( 'class', {
    resolver: () => ClassTC.getResolver( 'findById' ),
    prepareArgs: { // resolver `findByIds` has `_ids` arg, let provide value to it
        _id: ( source ) => source.class,
    },
    projection: { class: 1 }, // point fields in source object, which should be fetched from DB
} );
StudentTC.addRelation( 'firstName', {
    resolver: () => StudentTC.getResolver( 'firstName' ),
    prepareArgs: { // resolver `findByIds` has `_ids` arg, let provide value to it
        vkId: ( source ) => source.vkId,
    },
    projection: { vkId: 1 }, // point fields in source object, which should be fetched from DB
} );
StudentTC.addRelation( 'secondName', {
    resolver: () => StudentTC.getResolver( 'secondName' ),
    prepareArgs: { // resolver `findByIds` has `_ids` arg, let provide value to it
        vkId: ( source ) => source.vkId,
    },
    projection: { vkId: 1 }, // point fields in source object, which should be fetched from DB
} );
StudentTC.addRelation( 'fullName', {
    resolver: () => StudentTC.getResolver( 'fullName' ),
    prepareArgs: { // resolver `findByIds` has `_ids` arg, let provide value to it
        vkId: ( source ) => source.vkId,
    },
    projection: { vkId: 1 }, // point fields in source object, which should be fetched from DB
} );
ClassTC.addRelation( 'students', {
    resolver: () => StudentTC.getResolver( 'findByIds' ),
    prepareArgs: { // resolver `findByIds` has `_ids` arg, let provide value to it
        _ids: ( source ) => source.students,
    },
    projection: { class: 1 }, // point fields in source object, which should be fetched from DB
} );
ClassTC.addRelation( "studentsCount", {
    resolver: () => StudentTC.getResolver( 'count' ),
    prepareArgs: {
        filter: ( source ) => ( { class: source._id } ),
    },
    projection: { _id: 1 }
} );
StudentTC.addRelation( "className", {
    resolver: () => ClassTC.getResolver( 'name' ),
    prepareArgs: {
        class_id: source => source.class
    },
    projection: { class: 1 }
} );

schemaComposer.Query.addFields( {
    studentById: StudentTC.getResolver( 'findById' ),
    studentByIds: StudentTC.getResolver( 'findByIds' ),
    studentOne: StudentTC.getResolver( 'findOne' ),
    studentMany: StudentTC.getResolver( 'findMany' ),
    studentCount: StudentTC.getResolver( 'count' ),
    studentConnection: StudentTC.getResolver( 'connection' ),
    studentPagination: StudentTC.getResolver( 'pagination' ),
    classById: ClassTC.getResolver( 'findById' ),
    classByIds: ClassTC.getResolver( 'findByIds' ),
    classOne: ClassTC.getResolver( 'findOne' ),
    classMany: ClassTC.getResolver( 'findMany' ),
    classCount: ClassTC.getResolver( 'count' ),
    classConnection: ClassTC.getResolver( 'connection' ),
    classPagination: ClassTC.getResolver( 'pagination' ),
    getHomework: ClassTC.getResolver( 'getHomework' ),
    getChanges: ClassTC.getResolver( 'getChanges' ),
    getLessons: ClassTC.getResolver( 'lessons' ),
    getRoles: StudentTC.getResolver( 'roles' )
} );
schemaComposer.Mutation.addFields( {
    studentCreateOne: StudentTC.getResolver( 'studentCreateOne' ),
    studentCreateMany: StudentTC.getResolver( 'createMany' ),
    studentUpdateById: StudentTC.getResolver( 'updateById' ),
    studentUpdateOne: StudentTC.getResolver( 'updateOne' ),
    studentUpdateMany: StudentTC.getResolver( 'updateMany' ),
    studentRemoveById: StudentTC.getResolver( 'removeById' ),
    studentRemoveOne: StudentTC.getResolver( 'removeOne' ),
    studentRemoveMany: StudentTC.getResolver( 'removeMany' ),
    classCreateOne: ClassTC.getResolver( 'classCreateOne' ),
    classCreateMany: ClassTC.getResolver( 'createMany' ),
    classUpdateById: ClassTC.getResolver( 'updateById' ),
    classUpdateOne: ClassTC.getResolver( 'updateOne' ),
    classUpdateMany: ClassTC.getResolver( 'updateMany' ),
    classRemoveById: ClassTC.getResolver( 'removeById' ),
    classRemoveOne: ClassTC.getResolver( 'removeOne' ),
    classRemoveMany: ClassTC.getResolver( 'removeMany' ),
    changeDay: ClassTC.getResolver( 'changeDay' ),
    changeSettings: StudentTC.getResolver( 'changeSettings' ),
    removeStudentFromClass: StudentTC.getResolver( 'removeStudentFromClass' ),
    changeClass: StudentTC.getResolver( 'changeClass' ),
    banStudent: StudentTC.getResolver( 'banStudent' ),
} );

const graphqlSchema = schemaComposer.buildSchema();

module.exports = {
    graphqlSchema
};