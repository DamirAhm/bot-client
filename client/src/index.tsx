import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import ApolloClient, { gql } from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';
import { BrowserRouter } from 'react-router-dom';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { CachePersistor } from 'apollo3-cache-persist';
import { GET_CLASSES } from './components/Content/Classes/Classes';
import { Class } from './types';
import dotenv from 'dotenv';
import Loader from './components/Common/Loader/Loader';
dotenv.config();

const API_HOST =
	process.env.NODE_ENV === 'development' ? 'http://localhost:8080/graphql' : '/graphql';
const SCHEMA_VERSION = '1';
const SCHEMA_VERSION_KEY = 'apollo-schema-version';

const resolvers = {
	Mutation: {
		deleteClass: (
			_: any,
			{ className, schoolName }: { className: string; schoolName: string },
			{ cache }: { cache: InMemoryCache },
		) => {
			const classes = cache.readQuery<{ classes: Class[] }>({
				query: GET_CLASSES,
			});

			const newClasses =
				classes?.classes?.filter(
					(c: Class) => !(c.name === className && c.schoolName === schoolName),
				) || [];

			cache.writeQuery({
				query: GET_CLASSES,
				data: {
					classes: newClasses,
				},
			});

			return newClasses;
		},
		createClass: (_: any, { name }: { name: string }, { cache }: { cache: InMemoryCache }) => {
			const data = cache.readQuery<{
				classes: { name: string; studentsCount: number }[];
			}>({ query: GET_CLASSES });

			if (data !== null) {
				const newClasses = [
					...data.classes,
					{
						name,
						studentsCount: 0,
						__typename: 'Class',
						_id: Date.now().toString(),
					},
				];
				cache.writeQuery({
					query: GET_CLASSES,
					data: {
						classes: newClasses,
					},
				});

				return {
					name,
					studentsCount: 0,
					__typename: 'Class',
					_id: Date.now().toString(),
				};
			}
			return null;
		},
	},
};
const typeDefs = gql`
	fragment StudentPreview on Student {
		vkId
		className
		role
		fullName
		_id
	}
	fragment ClassPreview on Class {
		name
		studentsCount
	}
	extend type Mutation {
		deleteClass(className: String!, schoolName: String!): [Class]!
		createClass(className: String!, schoolName: String!): Class!
	}
`;

const createClient = async () => {
	const root = document.getElementById('root');
	const currentVersion = window.localStorage.getItem(SCHEMA_VERSION_KEY);

	ReactDOM.render(
		<div className="wrapper app">
			<Loader />
		</div>,
		root,
	);

	const cache = new InMemoryCache({
		dataIdFromObject: (obj: any | undefined) => {
			if (obj?._id) {
				return obj._id;
			} else {
				return null;
			}
		},
	});

	// const persistor = new CachePersistor({
	// 	//@ts-ignore
	// 	cache,
	// 	storage: window.localStorage,
	// 	debounce: 1000,
	// });

	// if (currentVersion === SCHEMA_VERSION) {
	// 	await persistor.restore();
	// } else {
	// 	await persistor.purge();
	// 	window.localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
	// }

	const client = new ApolloClient({
		uri: API_HOST,
		cache,
		resolvers,
		typeDefs,
	});

	ReactDOM.render(
		<ApolloProvider client={client}>
			<BrowserRouter>
				<React.StrictMode>
					<App />
				</React.StrictMode>
			</BrowserRouter>
		</ApolloProvider>,
		document.getElementById('root'),
	);

	// await persistor.purge();
};

createClient();

serviceWorker.register();
