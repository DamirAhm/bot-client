import React, { useEffect, useRef, useState } from 'react';
import Loader from '../Common/Loader/Loader';

enum states {
	loading = 'LOADING',
	error = 'ERROR',
	completed = 'COMPLETED',
}

type Props = {
	setUser: (user: returnUserType) => void;
};

const VKPlugin: React.FC<Props> = ({ setUser }) => {
	const [state, setState] = useState<states>(states.loading);
	const pluginRef = useRef<HTMLDivElement>(null);

	const onLoad = () => {
		if ('VK' in window) {
			VK.init({
				apiId: 7561699,
			});
		}

		setState(states.completed);
	};
	const onError = (e: ErrorEvent) => {
		console.error(e);

		setState(states.error);
	};

	useEffect(() => {
		const script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = 'https://vk.com/js/api/openapi.js?168';

		script.addEventListener('load', onLoad);
		script.addEventListener('error', onError);

		document.body.appendChild(script);

		return () => {
			script.removeEventListener('load', onLoad);
			script.removeEventListener('error', onError);
		};
	}, []);

	useEffect(() => {
		if (state === states.completed && pluginRef.current !== null) {
			if (process.env.NODE_ENV === 'production' && 'VK' in window) {
				VK.Widgets.Auth(pluginRef.current.id, { onAuth: setUser, width: 200 });
			} else {
				if (process.env.NODE_ENV === 'development') {
					try {
						const user = JSON.parse(process.env.REACT_APP_USER as string);
						setUser(user);
					} catch (e) {
						setState(states.error);
					}
				} else {
					setState(states.error);
				}
			}
		}
	}, [state, pluginRef]);

	if (state === states.loading) return <Loader />;
	else if (state === states.error)
		return (
			<div>
				Простите не удалось загрузить элемент авторизации 😔, попробуйте отключить
				блокировщик рекламы и перезагрузить страницу
			</div>
		);
	else {
		return <div ref={pluginRef} id='vk_auth'></div>;
	}
};

export default VKPlugin;
