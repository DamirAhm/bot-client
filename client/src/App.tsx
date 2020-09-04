import React, { lazy, Suspense } from 'react';
import Sidebar from "./components/Sidebar/Sidebar";
import { Redirect, Route, Switch } from "react-router";
import { roles, User } from "./types";
import withRedirect from "./HOCs/withAuth";
import { gql } from "apollo-boost";
import useAuth from "./hooks/useAuth";

const Classes = lazy(() => import("./components/Content/Classes/Classes"));
const Students = lazy(() => import("./components/Content/Students/Students"));
const StudentPage = lazy(() => import("./components/Content/StudentPage/StudentPage"));
const ClassPage = lazy(() => import('./components/Content/ClassPage/ClassPage'));
const Page404 = lazy(() => import("./components/Content/404/404"));

const Auth = lazy(() => import("./components/Content/Auth/Auth"));

export const UserContext = React.createContext<
    { isAuth: boolean } & User
>({
    isAuth: false,
    role: roles.student,
    className: "Нету",
    photo: "",
    photo_rec: "",
    last_name: "",
    first_name: "",
    uid: NaN
});

function App() {
    const [user, onUser, logOut] = useAuth();

    return (
        <UserContext.Provider value={{ isAuth: user !== null, ...user as User }}>
            <div className={`wrapper`}>
                <div className={`app`}>
                    {user === null
                        ? <Suspense fallback={<div>loading...</div>}>
                            <Auth setUser={onUser} />
                        </Suspense>
                        : <>
                            <Sidebar logOut={logOut} />
                            <div className="content">
                                <Suspense fallback={<div> Loading... </div>}>
                                    <Switch>
                                        <Route exact path="/classes" component={() => withRedirect(Classes)} />
                                        <Route
                                            path="/classes/:className"
                                            render={(props) => props.match.params.className === user.className
                                                ? <ClassPage />
                                                : withRedirect(ClassPage)
                                            } />
                                        <Route exact path="/students" component={() => withRedirect(Students)} />
                                        <Route path="/students/:vkId" component={() => withRedirect(StudentPage, true)} />
                                        <Route path="/404" component={() => withRedirect(Page404, true)} />
                                        <Route path="*" render={() => <Redirect to={"/classes"} />} />
                                    </Switch>
                                </Suspense>
                            </div>
                        </>
                    }
                </div>
            </div>
        </UserContext.Provider>
    );
}

export default App;
