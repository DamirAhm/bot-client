import React from 'react';
import { render } from '@testing-library/react';
import Options from './Options';
import { redactorOptions } from '../../../types';
import { UserContext } from '../../../App';

test('can render all options', () => {
	const options = render(
		<UserContext.Provider value={{ role: 'ADMIN' }}>
			<Options include={Object.values(redactorOptions)} />
		</UserContext.Provider>,
	);

	expect(Object.values(redactorOptions).every((key) => options.getByTestId(key))).toBe(true);
});
test('renders only given options', () => {
	const options = render(
		<UserContext.Provider value={{ role: 'ADMIN' }}>
			<Options
				include={[redactorOptions.add, redactorOptions.change, redactorOptions.delete]}
			/>
		</UserContext.Provider>,
	);

	expect(
		[redactorOptions.add, redactorOptions.change, redactorOptions.delete].every((key) =>
			options.getByTestId(key),
		),
	).toBe(true);
});
test('passes given props to given options and shared props to all options', () => {
	const options = render(
		<UserContext.Provider value={{ role: 'ADMIN' }}>
			<Options
				include={[redactorOptions.add, redactorOptions.delete]}
				props={{
					[redactorOptions.add]: {
						['data-random']: 'add',
					},
					[redactorOptions.delete]: {
						['data-random']: 'delete',
					},
				}}
				className="class"
			/>
		</UserContext.Provider>,
	);

	expect(options.getByTestId(redactorOptions.add).dataset.random).toBe('add');
	expect(options.getByTestId(redactorOptions.delete).dataset.random).toBe('delete');

	expect(options.getByTestId(redactorOptions.add).getAttribute('class')).toBe('class');
	expect(options.getByTestId(redactorOptions.delete).getAttribute('class')).toBe('class');
});
test("options doesn't renders if you haven't permissions", () => {
	const options = render(
		<UserContext.Provider value={{ role: 'CONTRIBUTOR' }}>
			<Options
				include={[redactorOptions.add, redactorOptions.change, redactorOptions.delete]}
				props={{
					[redactorOptions.change]: {
						allowOnlyRedactor: true,
						color: 'var(--accent)',
					},
					[redactorOptions.delete]: {
						allowOnlyAdmin: true,
					},
				}}
			/>
		</UserContext.Provider>,
	);

	expect(
		[redactorOptions.add, redactorOptions.change].every((key) => options.getByTestId(key)),
	).toBe(true);
	expect(options.queryByTestId(redactorOptions.delete)).toBeNull();
});
test('permissions could be shared', () => {
	const options = render(
		<UserContext.Provider value={{ role: 'STUDENT' }}>
			<Options
				include={[redactorOptions.add, redactorOptions.change, redactorOptions.delete]}
				withRoleControl
			/>
		</UserContext.Provider>,
	);

	expect(
		[redactorOptions.add, redactorOptions.change, redactorOptions.delete].every(
			(key) => options.queryByTestId(key) === null,
		),
	).toBe(true);
});
