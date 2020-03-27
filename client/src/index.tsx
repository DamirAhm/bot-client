import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import "reset.css";
import ApolloClient, {gql} from 'apollo-boost';
import {ApolloProvider} from '@apollo/react-hooks';
import {BrowserRouter} from 'react-router-dom';
import {InMemoryCache} from 'apollo-cache-inmemory';
import {GET_CLASSES} from "./components/Content/Classes/Classes";
import {Class} from "./types";

export const SIDEBAR_OPENED = gql`
    {
        sidebarOpened @client
    }
`;

const resolvers = {
    Mutation: {
        deleteClass: (_: any, {name}: { name: string }, {cache}: { cache: InMemoryCache }) => {
            const classes = cache.readQuery<{ classes: Class[] }>({query: GET_CLASSES});

            const newClasses = classes?.classes?.filter(c => c.name !== name) || [];

            cache.writeQuery({
                query: GET_CLASSES,
                data: {
                    classes: newClasses
                }
            });

            return newClasses;
        },
        createClass: (_: any, {name}: { name: string }, {cache}: { cache: InMemoryCache }) => {
            const data = cache.readQuery<{ classes: { name: string, studentsCount: number }[] }>({query: GET_CLASSES});

            if (data !== null) {
                const newClasses = [...data.classes, {
                    name,
                    studentsCount: 0,
                    __typename: "Class",
                    _id: Date.now().toString()
                }];
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
        },
        toggleSidebar: (_: any, {flag}: { flag: boolean }, {cache}: { cache: InMemoryCache }) => {
            cache.writeQuery({query: SIDEBAR_OPENED, data: {sidebarOpened: flag}});

            return {
                __typename: "Mutation",
                sidebarOpened: flag
            }
        }
    }
};

const typeDefs = gql`
    extend type Mutation {
        deleteClass(name: String): [Class]!
        createClass(name: String): Class!
        toggleSidebar(flag: Boolean): Boolean!
    }
    extend type Query {
        sidebarOpened: Boolean
    }
`;

const client = new ApolloClient({
    uri: "http://4d3b309f.ngrok.io/graphql",
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
                <App/>
            </React.StrictMode>
        </BrowserRouter>
    </ApolloProvider>,
    document.getElementById('root')
);

client.writeQuery({query: SIDEBAR_OPENED, data: {sidebarOpened: false}});

serviceWorker.unregister();
