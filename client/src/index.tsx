import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import "reset.css";
import ApolloClient from 'apollo-boost';
import {ApolloProvider} from '@apollo/react-hooks';
import {BrowserRouter} from 'react-router-dom';
import { InMemoryCache } from 'apollo-cache-inmemory';

const client = new ApolloClient({
    uri: "http://localhost:4000/graphql",
    cache: new InMemoryCache(),
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

serviceWorker.unregister();
