const app = require('express')();
const { ApolloServer, gql } = require('apollo-server-express');
const mongoose = require('mongoose');
const { graphqlSchema } = require('./schema');

mongoose.connect("mongodb+srv://Damir:CLv4QEJJrfZp4BC0@botdata-sp9px.mongodb.net/prod?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
}, () => console.log("Mongoose connected"));

const server = new ApolloServer({
    schema: graphqlSchema
});

server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);