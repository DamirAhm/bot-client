import React, { lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar/Sidebar';
import { Redirect, Route, Switch } from 'react-router';
import { roles, setStateProp, User } from './types';
import withRedirect from './HOCs/withAuth';
import useAuth from './hooks/useAuth';
import PickSchool from './components/Content/PickClass/PickSchool';
import Loader from './components/Common/Loader/Loader';

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
	className: null,
	photo: '',
	photo_rec: '',
	last_name: '',
	first_name: '',
	uid: NaN,
	schoolName: null,
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
						<Suspense fallback={<Loader />}>
							{!localStorage.getItem('user') && <Auth setUser={onUser} />}
						</Suspense>
					) : (
						<>
							<Sidebar logOut={logOut} />
							<div className="content">
								<Suspense fallback={<Loader />}>
									<Switch>
										<Route
											exact
											path="/pickClass/:schoolName?"
											component={() =>
												withRedirect(
													<PickClass setUser={setUser} />,
													user.className === null,
												)
											}
										/>
										<Route
											exact
											path="/pickSchool"
											component={() =>
												withRedirect(
													<PickSchool />,
													user.schoolName === null,
												)
											}
										/>
										<Route
											exact
											path="/:schoolName/classes"
											component={() => withRedirect(<Classes />)}
										/>
										<Route
											exact
											path="/:schoolName/classes/:className"
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
											render={() =>
												user.schoolName ? (
													<Redirect to={`/${user.schoolName}/classes`} />
												) : (
													<Redirect to={`/pickSchool`} />
												)
											}
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
