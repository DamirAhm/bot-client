import React, {lazy, Suspense} from 'react';
import Sidebar from "./components/Sidebar/Sidebar";
import {Redirect, Route, Switch} from "react-router";

const Classes = lazy(() => import("./components/Content/Classes/Classes"));
const Students = lazy(() => import("./components/Content/Students/Students"));

function App() {
    return (
        <div className={`wrapper`} onClick={() => document.querySelector(`.wrapper`)?.classList.remove("sidebarOpened")}>
            <div className={`app`}>
                <Sidebar/>
                <div className="content">
                    <Suspense fallback={<div> Loading... </div>}>
                        <Switch>
                            <Route path="/classes" component={Classes}/>
                            <Route path="/students" component={Students}/>
                            <Route paht="*" render={() => <Redirect to="/classes"/>}/>
                        </Switch>
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

export default App;
