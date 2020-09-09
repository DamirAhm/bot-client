import React, { lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import { Redirect, Route, Switch } from 'react-router';
import { roles, setStateProp, User } from './types';
import withRedirect from './HOCs/withAuth';
import useAuth from './hooks/useAuth';

const Classes = lazy(() => import('./components/Content/Classes/Classes'));
const Students = lazy(() => import('./components/Content/Students/Students'));
const StudentPage = lazy(() => import('./components/Content/StudentPage/StudentPage'));
const ClassPage = lazy(() => import('./components/Content/ClassPage/ClassPage'));
const PickClass = lazy(() => import('./components/Content/PickClass/PickClass'));
const Page404 = lazy(() => import('./components/Content/404/404'));

const Auth = lazy(() => import('./components/Content/Auth/Auth'));

export const UserContext = React.createContext<
	{ isAuth: boolean; setUser: (user: setStateProp<User | null>) => void } & User
>({
	isAuth: false,
	role: roles.student,
	className: 'Нету',
	photo: '',
	photo_rec: '',
	last_name: '',
	first_name: '',
	uid: NaN,
	setUser: () => void 0,
});

type fn<T> = (value: T) => T;

function App() {
	const [user, onUser, logOut, setUser] = useAuth();

	return (
		<UserContext.Provider value={{ isAuth: user !== null, ...(user as User), setUser }}>
			<div className={`wrapper`}>
				<div className={`app`}>
					{user === null ? (
						<Suspense fallback={<div>loading...</div>}>
							<Auth setUser={onUser} />
						</Suspense>
					) : (
						<>
							<Sidebar logOut={logOut} />
							<div className="content">
								<Suspense fallback={<div> Loading... </div>}>
									<Switch>
										<Route
											exact
											path="/pickClass"
											component={() =>
												user.className ? (
													withRedirect(
														<PickClass setUser={setUser} />,
														user.className === null,
													)
												) : (
													<Redirect to={`/classes/${user.className}`} />
												)
											}
										/>
										<Route
											exact
											path="/classes"
											component={() => withRedirect(<Classes />)}
										/>
										<Route
											exact
											path="/classes/:className"
											render={(props) =>
												withRedirect(
													<ClassPage />,
													props.match.params.className === user.className,
												)
											}
										/>
										<Route
											exact
											path="/students"
											component={() => withRedirect(<Students />)}
										/>
										<Route
											exact
											path="/students/:vkId"
											component={() => withRedirect(<StudentPage />, true)}
										/>
										<Route
											exact
											path="/404"
											component={() => withRedirect(<Page404 />, true)}
										/>
										<Route
											path="*"
											render={() => <Redirect to={'/classes'} />}
										/>
									</Switch>
								</Suspense>
							</div>
						</>
					)}
				</div>
			</div>
		</UserContext.Provider>
	);
}

export default App;
