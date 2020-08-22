"use strict";

var app = require("express")();

var _require = require("apollo-server-express"),
    ApolloServer = _require.ApolloServer;

var mongoose = require("mongoose");

var _require2 = require("./schema"),
    graphqlSchema = _require2.graphqlSchema;

var VK_API = require("bot-database/VkAPI/VK_API");

var config = require("./config.json");

var cors = require("cors");

var multer = require("multer");

var fs = require("fs");

var _require3 = require("bot-database/DataBase"),
    DB = _require3.DataBase;

var path = require("path");

var DataBase = new DB(config["MONGODB_URI"]);
var vk = new VK_API(config["VK_API_KEY"], config["GROUP_ID"], config["ALBUM_ID"]);

var getFileExtension = function getFileExtension(fileName) {
  return fileName.match(/(.*)\.[^.]+$/)[0];
};

var storage = multer.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function filename(req, file, cb) {
    var uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + getFileExtension(file.originalname));
  }
});
var upload = multer({
  storage: storage
});
DataBase.connect({
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}, function () {
  return console.log("Mongoose connected");
});
var server = new ApolloServer({
  typeDefs: "\n        attachment {\n            value: String\n            url: String\n            album_id: Int\n        }\n        homeworkWithAttachments {\n            ...ClassHomework\n            attachments [attachment]\n        }\n    ",
  schema: graphqlSchema
});
server.applyMiddleware({
  app: app
});
app.use(cors());
app.post("/saveAttachment", upload.array("newAttachment"), function _callee(req, res) {
  var photos, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, file, readStream, photo;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          photos = [];
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context.prev = 5;
          _iterator = req.files[Symbol.iterator]();

        case 7:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context.next = 18;
            break;
          }

          file = _step.value;
          readStream = fs.createReadStream(file.path);
          _context.next = 12;
          return regeneratorRuntime.awrap(vk.uploadPhotoToAlbum(readStream));

        case 12:
          photo = _context.sent;
          photos.push(photo[0]);
          fs.unlink(file.path, function (err) {
            if (err) {
              console.error(err);
            }
          });

        case 15:
          _iteratorNormalCompletion = true;
          _context.next = 7;
          break;

        case 18:
          _context.next = 24;
          break;

        case 20:
          _context.prev = 20;
          _context.t0 = _context["catch"](5);
          _didIteratorError = true;
          _iteratorError = _context.t0;

        case 24:
          _context.prev = 24;
          _context.prev = 25;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 27:
          _context.prev = 27;

          if (!_didIteratorError) {
            _context.next = 30;
            break;
          }

          throw _iteratorError;

        case 30:
          return _context.finish(27);

        case 31:
          return _context.finish(24);

        case 32:
          res.json({
            photos: photos
          });
          _context.next = 39;
          break;

        case 35:
          _context.prev = 35;
          _context.t1 = _context["catch"](0);
          console.error(_context.t1);
          res.send({
            error: _context.t1
          });

        case 39:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 35], [5, 20, 24, 32], [25,, 27, 31]]);
});
app.get("/*", function (req, res) {
  if (/\.(js|css|html|svg|ico|png|jpg|webp)$/i.test(req.url)) {
    res.sendFile(path.join(__dirname, "build", req.url));
  } else {
    res.sendFile(__dirname + "/build/index.html");
  }
});
app.listen({
  port: process.env.PORT || 8080
}, function () {
  return console.log("\uD83D\uDE80 Server ready at http://localhost:".concat(process.env.PORT || 8080).concat(server.graphqlPath));
});