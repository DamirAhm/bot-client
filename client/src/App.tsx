import React, { lazy, Suspense } from 'react';
import Sidebar from "./components/Sidebar/Sidebar";
import { Redirect, Route, RouteChildrenProps, RouteComponentProps, RouteProps, RouterProps, Switch } from "react-router";
import StudentPage from "./components/Content/StudentPage/StudentPage";
import ClassPage from './components/Content/ClassPage/ClassPage';

const Classes = lazy(() => import("./components/Content/Classes/Classes"));
const Students = lazy(() => import("./components/Content/Students/Students"));

function App() {
    return (
        <div className={`wrapper`}>
            <div className={`app`}>
                <Sidebar />
                <div className="content">
                    <Suspense fallback={<div> Loading... </div>}>
                        <Switch>
                            <Route exact path="/classes" component={Classes} />
                            <Route path="/classes/:className" render={(props: RouteComponentProps<{ className: string }>) => <ClassPage history={props.history} className={props.match.params.className} />} />
                            <Route exact path="/students" component={Students} />
                            <Route path="/students/:vkId" render={(props: RouteComponentProps<{ vkId: string }>) => <StudentPage vkId={Number(props.match.params.vkId)} />} />
                            <Route paht="*" render={() => <Redirect to="/classes" />} />
                        </Switch>
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

export default App;
