import React, { lazy, Suspense, useEffect, useState } from 'react';
import Sidebar from "./components/Sidebar/Sidebar";
import { Redirect, Route, RouteChildrenProps, RouteComponentProps, Switch } from "react-router";
import StudentPage from "./components/Content/StudentPage/StudentPage";
import ClassPage from './components/Content/ClassPage/ClassPage';
import { roles, Student, User } from "./types";
import withRedirect from "./HOCs/withAuth";
import { gql } from "apollo-boost";
import { useApolloClient, useQuery } from "@apollo/react-hooks";

const Classes = lazy(() => import("./components/Content/Classes/Classes"));
const Students = lazy(() => import("./components/Content/Students/Students"));
const Auth = lazy(() => import("./components/Content/Auth/Auth"));

export const RedirectContext = React.createContext<
    {
        role?: roles, 
        className?: string
        isAuth: boolean, 
    }
>({isAuth: false, role: roles.student, className: "Нету"});

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
    const [user, setUser] = useState<User | null>(null);

    const onUser = async (user: Omit<User, "role">) => {
        const { data: { student: { role, className } } } = await ApolloClient.query<
            {student: {role: roles, className: string}}, 
            {filter: Partial<Student>}
        >({query: GET_STUDENT, variables: { filter: {vkId: user.uid} }});
        
        const userWithRole = {...user, role, className}

        setUser(userWithRole);
        localStorage.setItem("user", JSON.stringify(userWithRole));
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
        <RedirectContext.Provider value={{isAuth: user !== null, role: user?.role, className: user?.className}}>
            <div className={`wrapper`}>
                <div className={`app`}>
                    {user === null 
                        ? <Suspense fallback={<div>loading...</div>}>
                            <Auth setUser={onUser}/>
                        </Suspense>
                        : <> 
                            {user.role === roles.admin && 
                                <Sidebar user={user} setUser={setUser}/>
                            }
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
                                    <Route path="/students/:vkId" component={() => withRedirect(StudentPage)} />
                                    <Route path="*" render={() => <Redirect to={"/classes"} />} />
                                </Switch>
                                </Suspense>
                            </div>
                        </> 
                    }
                </div>
            </div>
        </RedirectContext.Provider>
    );
}

export default App;
