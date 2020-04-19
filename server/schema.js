// @ts-nocheck
const { Roles, Lessons } = require( "./Models/utils" );
const { composeWithMongoose } = require( 'graphql-compose-mongoose' );
const { schemaComposer } = require( 'graphql-compose' );
const { StudentModel } = require( "./DataBase/Models/Student" );
const { ClassModel } = require( "./DataBase/Models/Class" );
const { DataBase } = require( "./DataBase/DataBase" );
const { createVkApi } = require( "./utils/functions" );

const vk = createVkApi( "0c44f72c9eb8568cdc477605a807a03b5f924e7cf0a18121eff5b8ba1b886f3789496034c2cc75bc83924" );

const getPhotoUrls = async ( ats ) => {
    const urls = [];

    for ( let at of ats ) {
        if ( /^photo/.test( at ) ) {
            const [ owner_id, photo_ids ] = at.slice( 5 ).split( "_" );
            urls.push( await vk( "photos.get", {
                owner_id,
                photo_ids,
                album_id: "saved"
            } ) )
        }
    }

    return urls.map( e => e.items[ 0 ].sizes[ 4 ].url );
}

const customizationOptions = {};

const StudentTC = composeWithMongoose( StudentModel, customizationOptions );
const ClassTC = composeWithMongoose( ClassModel, customizationOptions );

ClassTC.addResolver( {
    name: "getSchedule",
    type: "[ [ String ] ]",
    args: { className: "String!" },
    resolve: async ( { source, args, context, info } ) => {
        const Class = await DataBase.getClassByName( args.className );
        return Class.schedule;
    }
} )
ClassTC.addResolver( {
    name: "getHomework",
    type: `[${ClassTC.get( "homework" ).getType()}]`,
    args: { className: "String!", date: "Date" },
    resolve: async ( { source, args, context, info } ) => {
        let result = await DataBase.getHomework( args.className, args.date );
        for ( const hw of result ) {
            hw.attachments = await getPhotoUrls( hw.attachments )
        }

        return result;
    }
} );
ClassTC.addResolver( {
    name: "changeDay",
    type: ClassTC.getType(),
    args: { className: "String!", dayIndex: "Int!", newSchedule: "[String]!" },
    resolve: async ( { source, args, context, info } ) => {
        await DataBase.changeDay( args.className, args.dayIndex, args.newSchedule );
        return await DataBase.getClassByName( args.className );
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
        if ( args.class_id ) {
            const Class = await DataBase.getClassBy_Id( args.class_id );
            return Class.name
        } else {
            return "Нету";
        }
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

//TODO
// ClassTC.addResolver( {
//     name: "removeHomework",
//     type: ClassTC.getType(),
//     args: { className: "String!", homeworkId: "String!" },
//     resolve: async ( { source, args, context, info } ) => {
//         await DataBase.removeHomework( args.className, args.homeworkId );
//         return await DataBase.getClassByName( args.className );
//     }
// } );


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
StudentTC.addResolver( {
    name: "getForClass",
    type: "[Student]",
    args: { className: "String" },
    resolve: async ( { source, args, context, info } ) => {
        const Class = await DataBase.getClassByName( args.className );
        return await StudentModel.find( { _id: { $in: Class.students } } );
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
    getRoles: StudentTC.getResolver( 'roles' ),
    studentsForClass: StudentTC.getResolver( 'getForClass' ),
    getSchedule: ClassTC.getResolver( "getSchedule" ),
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