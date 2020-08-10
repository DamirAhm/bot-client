import React from "react"
import { Redirect } from "react-router-dom"
import { IsAuthContext } from "../App";

const withAuth = (Component: React.FC): JSX.Element => {
    return <IsAuthContext.Consumer>
        {(isAuth) =>
            <> {isAuth ?
                <Component /> : 
                <Redirect to="/auth" />
            }
            </>
        }
    </IsAuthContext.Consumer>
}

export default withAuth;