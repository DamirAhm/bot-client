import React from "react"
import { Redirect } from "react-router-dom"
import { RedirectContext } from "../App";
import { roles } from "../types";

const withRedirect = (Component: React.FC): JSX.Element => {
    return <RedirectContext.Consumer>
        {({isAuth, role, className}) =>
            <> {isAuth ? 
                <>{role === roles.admin 
                    ? <Component /> 
                    : <Redirect to={`/classes/${className}`}/>
                }</>
                : <Redirect to="/auth" />
            }
            </>
        }
    </RedirectContext.Consumer>
}

export default withRedirect;