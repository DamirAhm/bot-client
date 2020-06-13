const app = require( 'express' )();
const { ApolloServer } = require( 'apollo-server-express' );
const mongoose = require( 'mongoose' );
const { graphqlSchema } = require( './schema' );
const VK_API = require( './DataBase/VkAPI/VK_API' );
const config = require( 'config' );
const cors = require( "cors" );
const multer = require( "multer" );
const fs = require( "fs" );
const path = require( "path" );

const vk = new VK_API( config.get( "VK_API_KEY" ), config.get( "GROUP_ID" ), config.get( "ALBUM_ID" ) );


const getFileExtension = fileName => fileName.match( /(.*)\.[^.]+$/ )[ 0 ];
const parseAttachment = ( photo ) => {
    return `photo${photo.owner_id}_${photo.id}`;
};

const storage = multer.diskStorage( {
    destination: function ( req, file, cb ) {
        cb( null, 'uploads/' );
    },
    filename: function ( req, file, cb ) {
        const uniqueSuffix = Date.now() + '-' + Math.round( Math.random() * 1E9 );
        cb( null, file.fieldname + '-' + uniqueSuffix + getFileExtension( file.originalname ) );
    }
} )

var upload = multer( { storage: storage } )

mongoose.connect( "mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/prod?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}, () => console.log( "Mongoose connected" ) );

const server = new ApolloServer( {
    typeDefs: `
        attachment {
            value: String
            url: String
            album_id: Int
        }
        homeworkWithAttachments {
            ...ClassHomework
            attachments [attachment]
        }
    `,
    schema: graphqlSchema,
} );

server.applyMiddleware( { app } );

app.use( cors() );

app.post( "/saveAttachment", upload.array( 'newAttachment', 5 ), async ( req, res ) => {
    try {
        const { type, className, id } = req.query;

        if ( type && className && id && [ "homework", "changes" ].includes( type ) ) {
            const photos = [];
            for ( const file of req.files ) {
                const readStream = fs.createReadStream( file.path );
                const photo = await vk.uploadPhotoToAlbum( readStream );
                photos.push( photo );
                fs.unlink( file.path, function ( err ) {
                    if ( err ) {
                        console.error( err );
                    }
                } );
            };

            const classToSaveAttachment = await Class.findOne( { className } );
            if ( classToSaveAttachment ) {
                const element = classToSaveAttachment[ type ].find( el => el._id.toString() === id );
                if ( element ) {
                    const attachments = photos.map( photo => ( {
                        album_id: photo.album_id,
                        url: photo.sizes[ 4 ].url,
                        value: parseAttachment( photo )
                    } ) );

                    if ( element.attachments ) {
                        element.attachments = element.attachments.concat( attachments );

                        await classToSaveAttachment.save();

                        res.send( attachments );
                    }
                } else {
                    res.send( { error: "Can't find element of given type by id" } );
                }
            } else {
                res.status( 503 ).send( { error: "Can't find file" } );
            }
        } else {
            res.send( { error: "You must specifie type and className of attachment if query" } );
        }
    } catch ( e ) {
        console.error( e );
        res.send( { error: e } );
    }
} )

app.listen( { port: 4000 }, () =>
    console.log( `🚀 Server ready at http://localhost:4000${server.graphqlPath}` )
);

// console.log( __dirname + "/uploads/0bc92e03aab64a270f9741a03f415417.png" );

// console.log( fs.createReadStream( "D:/Users/Damir/Desktop/Programmin/bot-stuff/bot-client/server/uploads/0bc92e03aab64a270f9741a03f415417.png" ) )