import React from "react"
import { Redirect } from "react-router-dom"
import { UserContext } from "../App";
import { roles } from "../types";

const withRedirect = (Component: React.FC, allowStudent: boolean = false): JSX.Element => {
    return <UserContext.Consumer>
        {({isAuth, role, className}) =>
            <> {isAuth ? 
                <>{role === roles.admin || allowStudent 
                    ? <Component /> 
                    : <Redirect to={`/classes/${className}`}/>
                }</>
                : <Redirect to="/auth" />
            }
            </>
        }
    </UserContext.Consumer>
}

export default withRedirect;