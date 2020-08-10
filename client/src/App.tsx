import React, { lazy, Suspense, useEffect, useState } from 'react';
import Sidebar from "./components/Sidebar/Sidebar";
import { Redirect, Route, RouteChildrenProps, RouteComponentProps, Switch } from "react-router";
import StudentPage from "./components/Content/StudentPage/StudentPage";
import ClassPage from './components/Content/ClassPage/ClassPage';
import { User } from "./types";
import withAuth from "./HOCs/withAuth";

const Classes = lazy(() => import("./components/Content/Classes/Classes"));
const Students = lazy(() => import("./components/Content/Students/Students"));
const Auth = lazy(() => import("./components/Content/Auth/Auth"));

export const IsAuthContext = React.createContext(false);

function App() {
    const [user, setUser] = useState<User | null>(null);

    const onUser = (user: User) => {
        setUser(user);
        console.log(user);
        localStorage.setItem("user", JSON.stringify(user));
    }

    useEffect(() => {
        const userItem = localStorage.getItem("user");

        if (userItem) { 
            const parsedUser = JSON.parse(userItem);
            if (typeof parsedUser === "object") {
                setUser(parsedUser);
            } else {
                localStorage.removeItem("user");
            }
        }
    }, [])

    return (
        <IsAuthContext.Provider value={user !== null}>
            <div className={`wrapper`}>
                <div className={`app`}>
                    <Sidebar user={user} setUser={setUser}/>
                    <div className="content">
                        <Suspense fallback={<div> Loading... </div>}>
                        <Switch>
                            <Route exact path="/classes" component={() => withAuth(Classes)} />
                            <Route path="/classes/:className" component={() => withAuth(ClassPage)} />
                            <Route exact path="/students" component={() => withAuth(Students)} />
                            <Route path="/students/:vkId" component={() => withAuth(StudentPage)} />
                            <Route exact path="/auth" render={() => user === null ? <Auth setUser={onUser}/> : <Redirect to="/classes" />} />
                            <Route path="*" render={() => <Redirect to={user === null ? "/auth" : "/classes"} />} />
                        </Switch>
                        </Suspense>
                    </div>
                </div>
            </div>
        </IsAuthContext.Provider>
    );
}

export default App;
