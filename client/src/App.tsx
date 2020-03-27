import React, {lazy, Suspense} from 'react';
import styles from "./App.module.css";
import Sidebar from "./components/Sidebar/Sidebar";
import {Redirect, Route, Switch} from "react-router";
import {gql} from "apollo-boost";
import {useMutation, useQuery} from "@apollo/react-hooks";
import {SIDEBAR_OPENED} from "./index";

const Classes = lazy(() => import("./components/Content/Classes/Classes"));
const Students = lazy(() => import("./components/Content/Students/Students"));

export const TOGGLE_SIDEBAR = gql`
    mutation ToggleSidebar($flag: Boolean) {
        toggleSidebar(flag: $flag) @client
    }
`;

function App() {
    const [hideSidebar] = useMutation<{toggleSidebar: boolean}, {flag: boolean}>(TOGGLE_SIDEBAR, {variables: {flag: false}});
    const {data} = useQuery<{sidebarOpened: boolean}>(SIDEBAR_OPENED);
    return (
        <div className={styles.wrapper} onClick={() => hideSidebar()}>
            <div className={`app ${data?.sidebarOpened ? "sidebarOpened" : ""}`}>
                <Sidebar/>
                <div className={styles.content}>
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
