import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import ApolloClient, { gql } from 'apollo-boost';
import { ApolloProvider } from '@apollo/react-hooks';
import { BrowserRouter } from 'react-router-dom';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { GET_CLASSES } from './components/Content/Classes/Classes';
import { Class } from './types';
import dotenv from 'dotenv';

dotenv.config();

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

const client = new ApolloClient({
	uri: process.env.NODE_ENV === 'development' ? 'http://localhost:8080/graphql' : '/graphql',
	cache: new InMemoryCache({
		dataIdFromObject: (obj: any | undefined) => {
			console.log(obj);
			if (obj?._id) {
				return obj._id;
			} else {
				return null;
			}
		},
	}),
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

serviceWorker.register();
