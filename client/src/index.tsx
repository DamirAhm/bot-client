import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import ApolloClient, { gql } from "apollo-boost";
import { ApolloProvider } from "@apollo/react-hooks";
import { BrowserRouter } from "react-router-dom";
import { InMemoryCache } from "apollo-cache-inmemory";
import { GET_CLASSES } from "./components/Content/Classes/Classes";
import { Class } from "./types";

const resolvers = {
    Mutation: {
        deleteClass: (
            _: any,
            { name }: { name: string },
            { cache }: { cache: InMemoryCache }
        ) => {
            const classes = cache.readQuery<{ classes: Class[] }>({
                query: GET_CLASSES
            });

            const newClasses =
                classes?.classes?.filter((c: Class) => c.name !== name) || [];

            cache.writeQuery({
                query: GET_CLASSES,
                data: {
                    classes: newClasses
                }
            });

            return newClasses;
        },
        createClass: (
            _: any,
            { name }: { name: string },
            { cache }: { cache: InMemoryCache }
        ) => {
            const data = cache.readQuery<{
                classes: { name: string; studentsCount: number }[];
            }>({ query: GET_CLASSES });

            if (data !== null) {
                const newClasses = [
                    ...data.classes,
                    {
                        name,
                        studentsCount: 0,
                        __typename: "Class",
                        _id: Date.now().toString()
                    }
                ];
                cache.writeQuery({
                    query: GET_CLASSES,
                    data: {
                        classes: newClasses
                    }
                });

                return {
                    name,
                    studentsCount: 0,
                    __typename: "Class",
                    _id: Date.now().toString()
                };
            }
            return null;
        }
    }
};

const typeDefs = gql`
  extend type Mutation {
    deleteClass(name: String): [Class]!
    createClass(name: String): Class!
  }
  extend type Query {
    sidebarOpened: Boolean
  }
`;

const client = new ApolloClient({
    uri: "http://localhost:4000/graphql",
    cache: new InMemoryCache({
        dataIdFromObject: (obj: any) => {
            switch (obj.__typename) {
                case "Class": {
                    return obj.name;
                }
                case "Student": {
                    return obj.vkId;
                }
                default: {
                    return null;
                }
            }
        }
    }),
    resolvers,
    typeDefs
});

ReactDOM.render(
    <ApolloProvider client={client}>
        <BrowserRouter>
            <React.StrictMode>
                <App />
            </React.StrictMode>
        </BrowserRouter>
    </ApolloProvider>,
    document.getElementById("root")
);

serviceWorker.unregister();
