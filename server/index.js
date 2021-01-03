require('dotenv').config();
const app = require('express')();
const { ApolloServer } = require('apollo-server-express');
const { graphqlSchema } = require('./schema');
const { VK_API, DataBase: DB } = require('bot-database');
const config = require('./config.json');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sirv = require('sirv');
const compression = require('compression');

const DataBase = new DB(process.env.MONGODB_URI);
const vk = new VK_API(process.env.VK_API_KEY, config['GROUP_ID'], config['ALBUM_ID']);

const getFileExtension = (fileName) => fileName.match(/(.*)\.[^.]+$/)[0];

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, 'uploads'));
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		cb(null, file.fieldname + '-' + uniqueSuffix + getFileExtension(file.originalname));
	},
});

var upload = multer({ storage: storage });

DataBase.connect(
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	},
	() => console.log('Mongoose connected'),
);

const server = new ApolloServer({
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
});

server.applyMiddleware({ app });

app.use(cors());
app.use(
	sirv(path.join(__dirname, 'build'), {
		maxAge: 31536000,
		immutable: true,
		gzip: true,
	}),
);
app.use(compression());

app.post('/saveAttachment', upload.array('newAttachment'), async (req, res) => {
	try {
		const photos = [];
		for (const file of req.files) {
			const readStream = fs.createReadStream(file.path);
			const photo = await vk.uploadPhotoToAlbum(readStream);
			photos.push(photo[0]);
			fs.unlink(file.path, function (err) {
				if (err) {
					console.error(err);
				}
			});
		}

		res.json({ photos });
	} catch (e) {
		console.error(e);
		res.send({ error: e.message, stack: e.stack });
	}
});

app.get('/*', (_, res) => {
	res.sendFile(path.join(__dirname, 'build/index.html'));
});

app.listen({ port: process.env.PORT || 8080 }, () =>
	console.log(
		`🚀 Server ready at http://localhost:${process.env.PORT || 8080} ${server.graphqlPath}`,
	),
);
