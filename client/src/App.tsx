import React, { lazy, Suspense, useEffect, useState } from 'react';
import Sidebar from "./components/Sidebar/Sidebar";
import { Redirect, Route, Switch } from "react-router";
import StudentPage from "./components/Content/StudentPage/StudentPage";
import ClassPage from './components/Content/ClassPage/ClassPage';
import { roles, Student, User } from "./types";
import withRedirect from "./HOCs/withAuth";
import { gql } from "apollo-boost";
import { useApolloClient } from "@apollo/react-hooks";
import md5 from "md5";

const Classes = lazy(() => import("./components/Content/Classes/Classes"));
const Students = lazy(() => import("./components/Content/Students/Students"));
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

const GET_STUDENT = gql`
    query GET_STUDENT($filter: FilterFindOneStudentInput!) {
        student: studentOne(filter: $filter) {
            role
            className
        } 
    }
`

function App() {
    const ApolloClient = useApolloClient();
    const [user, setUser] = useState<User | null>(
        process.env.NODE_ENV === "production"
            ? null
            : JSON.parse(process.env.REACT_APP_USER || "null") as User ||
            {
                role: (process.env.REACT_APP_ROLE || "ADMIN") as roles,
                className: process.env.REACT_APP_CLASS_NAME || "10Б",
                first_name: process.env.REACT_APP_FIRST_NAME || "Дамир",
                last_name: process.env.REACT_APP_LAST_NAME || "Ахметзянов",
                photo: process.env.REACT_APP_PHOTO || "/images/camera_200.png?ava=1",
                photo_rec: process.env.REACT_APP_PHOTO_REC || "/images/camera_50.png?ava=1",
                uid: process.env.REACT_APP_UID || 227667805,
            }
    );

    const onUser = async ({ hash, session, ...user }: returnUserType) => {
        const { data: { student: { role, className } } } = await ApolloClient.query<
            { student: { role: roles, className: string } },
            { filter: Partial<Student> }
        >({ query: GET_STUDENT, variables: { filter: { vkId: user.uid } } });

        const userWithRole: User = { ...user, role, className }
        console.log(hash, `` + process.env.REACT_APP_APP_ID + user.uid + process.env.REACT_APP_SECRET)
        setUser(userWithRole);
        localStorage.setItem("user", JSON.stringify(userWithRole));
        localStorage.setItem("hash", `` + process.env.REACT_APP_APP_ID + user.uid + process.env.REACT_APP_SECRET)
    }

    useEffect(() => {
        if (!user) {
            const userItem = localStorage.getItem("user");
            const hash = localStorage.getItem("hash");

            const app_id = process.env.REACT_APP_APP_ID;
            const secret = process.env.REACT_APP_SECRET;
            if (userItem && hash) {
                const parsedUser = JSON.parse(userItem);
                if (typeof parsedUser === "object") {
                    if (Object.keys(parsedUser).every(key => ["first_name", "last_name", "uid", "hash", "photo_rec"].includes(key))) {
                        if (hash === app_id + parsedUser.uid + secret) {
                            setUser(parsedUser);
                        } else {
                            localStorage.removeItem("user");
                            localStorage.removeItem("hash");
                        }
                    } else {
                        localStorage.removeItem("user");
                        localStorage.removeItem("hash");
                    }
                } else {
                    localStorage.removeItem("user");
                    localStorage.removeItem("hash");
                }
            }
        }
    }, [user]);

    return (
        <UserContext.Provider value={{ isAuth: user !== null, ...user as User }}>
            <div className={`wrapper`}>
                <div className={`app`}>
                    {user === null
                        ? <Suspense fallback={<div>loading...</div>}>
                            <Auth setUser={onUser} />
                        </Suspense>
                        : <>
                            <Sidebar setUser={setUser} />
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
