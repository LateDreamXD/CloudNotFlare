type RequestData = {
	path: string;
	authInfo: Account;
}

const createUrl = (data: RequestData) => {
	if(!data.path.startsWith('/')) data.path = `/${data.path}`;
	return `/api${data.path}`.replace(/%zone_id%/g, data.authInfo.zoneId);
}

export const req = async (data: RequestData, options?: RequestInit) => {
	const res = await fetch(createUrl(data), {
		...options,
		headers: {
			Authorization: `Bearer ${data.authInfo.apiToken}`,
		}
	});
	if(!res.ok) throw new Error(`Request failed with status ${res.status}`);
	return res;
}
