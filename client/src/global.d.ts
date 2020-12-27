//TODO wirte type

type returnUserType = {
	photo: string;
	photo_rec: string;
	first_name: string;
	last_name: string;
	uid: number;
	hash: string;
	session: {
		mid: number;
		sid: string;
		secret: string;
		expire: number;
		sig: string;
	};
};

type vkType = {
	Widgets: {
		Auth(id: string, settings: { onAuth: (user: returnUserType) => void; width: number });
	};
	init(settings: { apiId: number | string });
};

declare var VK: vkType;
