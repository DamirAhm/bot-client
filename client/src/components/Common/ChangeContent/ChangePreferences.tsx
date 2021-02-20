import React from 'react';
import { userPreferences } from '../../../types';
import createContentFiller, {
	ContentSectionProps,
} from '../../../utils/createContentChanger/createContentChanger';

type userPreferencesInput = Omit<userPreferences, 'daysForNotification'> & {
	daysForNotification: string;
};

export type ChangePreferencesProps = {
	[K in keyof userPreferencesInput]: ContentSectionProps<userPreferencesInput[K], {}>;
};

const daysForNotificationRegExp = /^\d\s*(,\s*\d{1}\s*)*,?$/;
const notificationTimeRegExp = /(\d{2}):(\d{2})/;

const ChangePreferencesProps: ChangePreferencesProps = {
	daysForNotification: {
		title: 'Дни для оповещения',
		ContentComponent: ({ value, changeHandler }) => {
			return (
				<input type="text" value={value} onChange={(e) => changeHandler(e.target.value)} />
			);
		},
		defaultValue: '',
		validator: (value: string) => {
			if (value.trim() !== '' && !daysForNotificationRegExp.test(value)) {
				return 'Дни оповещения должны состоять из цифр через запятую или пробел';
			}
		},
	},
	notificationTime: {
		title: 'Время оповещения',
		ContentComponent: ({ value, changeHandler }) => {
			return (
				<input
					type="time"
					value={value || '16:00'}
					onChange={(e) => changeHandler(e.target.value)}
				/>
			);
		},
		validator: (value) => {
			if (value) {
				if (!notificationTimeRegExp.test(value)) {
					return 'Строка должна быть в формате ЧЧ:ММ';
				} else {
					const [_, first, second] = value.match(
						notificationTimeRegExp,
					) as RegExpMatchArray;

					if (!isNaN(+first) && !isNaN(+second)) {
						if (+first < 0 || +first > 23 || +second < 0 || +second > 59) {
							return 'Проверьте правильность введенного времени';
						}
					}
				}
			}
		},
	},
	notificationEnabled: {
		title: 'Включено ли оповещение',
		ContentComponent: ({ value, changeHandler }) => {
			return (
				<input
					type="checkbox"
					checked={value ?? true}
					onChange={(e) => changeHandler(e.target.checked)}
				/>
			);
		},
	},
};

const ChangePreferences = createContentFiller<{}, ChangePreferencesProps>(
	ChangePreferencesProps,
	{},
	(state) => {
		if (state.daysForNotification.trim() === '' && state.notificationEnabled) {
			return 'Если у вас включены оповещения, обязательно должны быть дни для них';
		}
	},
);

export default ChangePreferences;
