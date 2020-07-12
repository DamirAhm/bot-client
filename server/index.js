const app = require( 'express' )();
const { ApolloServer } = require( 'apollo-server-express' );
const mongoose = require( 'mongoose' );
const { graphqlSchema } = require( './schema' );
const VK_API = require( 'bot-database/VkAPI/VK_API' );
const config = require( 'config' );
const cors = require( "cors" );
const multer = require( "multer" );
const fs = require( "fs" );
const { DataBase: DB } = require( "bot-database/DataBase" );
const serveHandler = require( "serve-handler" );

const DataBase = new DB( config.get( "MONGODB_URI" ) );
const vk = new VK_API( config.get( "VK_API_KEY" ), config.get( "GROUP_ID" ), config.get( "ALBUM_ID" ) );


const getFileExtension = fileName => fileName.match( /(.*)\.[^.]+$/ )[ 0 ];

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

DataBase.connect( {
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

app.post( "/saveAttachment", upload.array( 'newAttachment' ), async ( req, res ) => {
    try {
        const photos = [];

        for ( const file of req.files ) {
            const readStream = fs.createReadStream( file.path );
            const photo = await vk.uploadPhotoToAlbum( readStream );
            photos.push( photo[ 0 ] );
            fs.unlink( file.path, function ( err ) {
                if ( err ) {
                    console.error( err );
                }
            } );
        };

        res.json( { photos } );
    } catch ( e ) {
        console.error( e );
        res.send( { error: e } );
    }
} )

app.get( "/*", ( req, res ) => {
    if ( /\.(js|css|html|svg|ico|png|jpg|webp)$/i.test( req.url ) ) {
        serveHandler( req, res, { public: "./build" } )
    } else {
        res.sendFile( __dirname + "/build/index.html" )
    }
} );

app.listen( { port: process.env.PORT || 8080 }, () =>
    console.log( `🚀 Server ready at http://localhost:${process.env.PORT || 8080}${server.graphqlPath}` )
);
