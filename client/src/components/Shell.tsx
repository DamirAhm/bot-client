import { ApolloProvider } from '@apollo/react-hooks';
import { InMemoryCache } from 'apollo-cache-inmemory';
import ApolloClient, { gql } from 'apollo-boost';
import { CachePersistor } from 'apollo3-cache-persist';
import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Class } from '../types';
import Loader from './Common/Loader/Loader';
import { GET_CLASSES } from './Content/Classes/Classes';

const API_HOST: string =
	process.env.NODE_ENV === 'development' ? 'http://localhost:8080/graphql' : '/graphql';
const SCHEMA_VERSION = '1';
const SCHEMA_VERSION_KEY = 'apollo-schema-version';
const currentVersion = window.localStorage.getItem(SCHEMA_VERSION_KEY);

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

const Shell: React.FC<{ children: JSX.Element }> = ({ children }) => {
	const [client, setClient] = useState<ApolloClient<unknown> | null>(null);

	useEffect(() => {
		const cache = new InMemoryCache({
			dataIdFromObject: (obj: any | undefined) => {
				if (obj?._id) {
					return obj._id;
				} else {
					return null;
				}
			},
		});

		const persistor = new CachePersistor({
			//@ts-ignore
			cache,
			storage: window.localStorage,
			debounce: 1000,
		});

		if (currentVersion === SCHEMA_VERSION) {
			persistor.restore();
		} else {
			persistor.purge();
			window.localStorage.setItem(SCHEMA_VERSION_KEY, SCHEMA_VERSION);
		}

		const client = new ApolloClient({
			uri: API_HOST,
			cache,
			resolvers,
			typeDefs,
		});

		setClient(client);

		//@ts-ignore
		window.a = client;
		// window.addEventListener('blur', client.resetStore);
		return () => {
			window.removeEventListener('blur', client.resetStore);
		};
	}, []);

	if (client === null) {
		return (
			<div className="wrapper app">
				<Loader />
			</div>
		);
	}

	return (
		<ApolloProvider client={client}>
			<BrowserRouter>{children}</BrowserRouter>
		</ApolloProvider>
	);
};

export default Shell;
