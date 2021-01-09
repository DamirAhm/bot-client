import { WebSocketLink } from '@apollo/client/link/ws';
import { CachePersistor } from 'apollo3-cache-persist';
import { HttpLink, split, InMemoryCache, ApolloClient, ApolloProvider, gql } from '@apollo/client';

import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { Class } from '../types';
import Loader from './Common/Loader/Loader';
import { GET_CLASSES } from './Content/Classes/Classes';
import { getMainDefinition } from '@apollo/client/utilities';

const API_HOST =
	process.env.NODE_ENV === 'development' ? 'http://localhost:8080/graphql' : '/graphql';
const WEB_SOCKET_HOST =
	process.env.NODE_ENV === 'development'
		? 'ws://localhost:8080/graphql'
		: `ws://${document.location.origin}/graphql`;
const SCHEMA_VERSION = '1';
const SCHEMA_VERSION_KEY = 'apollo-schema-version';
const currentVersion = window.localStorage.getItem(SCHEMA_VERSION_KEY);

const httpLink = new HttpLink({
	uri: API_HOST,
});
const websocketLink = new WebSocketLink({
	uri: WEB_SOCKET_HOST,
	options: {
		reconnect: true,
	},
});

const splitLink = split(
	({ query }) => {
		const def = getMainDefinition(query);

		return def.kind === 'OperationDefinition' && def.operation === 'subscription';
	},
	websocketLink,
	httpLink,
);

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

		if (process.env.NODE_ENV === 'production') {
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
		}

		const client = new ApolloClient({
			uri: API_HOST,
			cache,
			resolvers,
			typeDefs,
			link: splitLink,
		});

		setClient(client);

		if (process.env.NODE_ENV === 'production') {
			// @ts-ignore
			if (client.queryManager.inFlightLinkObservables.size !== 0)
				window.addEventListener('blur', client.resetStore);
			else
				setTimeout(() => {
					// @ts-ignore
					if (client.queryManager.inFlightLinkObservables.size !== 0)
						window.addEventListener('blur', client.resetStore);
				}, 500);

			return () => {
				window.removeEventListener('blur', client.resetStore);
			};
		}
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
