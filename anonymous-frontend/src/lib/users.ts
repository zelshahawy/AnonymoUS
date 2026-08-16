export const normalizeUsername = (value: string) => value.trim().toLowerCase();

export const isSameUser = (left: string, right: string) =>
	normalizeUsername(left) === normalizeUsername(right);

/**
 * Shared demo accounts. These are not real backend users, so anything that
 * would normally persist server-side stays in localStorage for them.
 */
export const DEMO_USERS = ['testuser1', 'testuser2'];

export const isDemoUser = (username: string) =>
	DEMO_USERS.some(demo => isSameUser(demo, username));
