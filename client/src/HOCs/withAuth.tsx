import React from 'react';
import { Redirect } from 'react-router-dom';
import { UserContext } from '../App';
import { roles } from '../types';

const withRedirect = (
	Component: React.FC | JSX.Element,
	allowStudent: boolean = false,
): JSX.Element => {
	return (
		<UserContext.Consumer>
			{({ isAuth, role, className, schoolName }) => (
				<>
					{isAuth ? (
						<>
							{role === roles.admin || allowStudent ? (
								typeof Component === 'function' ? (
									<Component />
								) : (
									Component
								)
							) : (
								<Redirect
									to={
										className != null && schoolName != null
											? `/${schoolName}/classes/${className}`
											: `/pickClass/${schoolName || ''}`
									}
								/>
							)}
						</>
					) : (
						<Redirect to="/auth" />
					)}
				</>
			)}
		</UserContext.Consumer>
	);
};

export default withRedirect;
