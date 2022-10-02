import React, { useContext, useEffect, useState } from "react";
import { useUserId, useNhostClient } from "@nhost/nextjs";

import { gql, useQuery } from "@apollo/client";

const GET_USER_QUERY = gql`
	query GetUser($id: uuid!) {
		user(id: $id) {
			id
			email
			displayName
			metadata
			avatarUrl
		}
	}
`;

const UserContext = React.createContext(null);

export function UserProvider({ children = null }) {
	const { storage } = useNhostClient();
	const id = useUserId();
	const { loading, error, data } = useQuery(GET_USER_QUERY, {
		variables: { id },
		skip: !id,
	});
	const user = data?.user;

	const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null);
	useEffect(() => {
		if (user && user.metadata?.avatarId) {
			(async () => {
				const { presignedUrl } = await storage.getPresignedUrl({
					fileId: user.metadata.avatarId,
				});
				setAvatarUrl(presignedUrl?.url);
			})();
		}
	}, [user]);

	if (error) {
		return <p>Something went wrong. Try to refresh the page.</p>;
	}

	if (loading) {
		return null;
	}

	return (
		<UserContext.Provider
			value={{
				user: {
					...user,
					avatarUrl,
				},
			}}
		>
			{children}
		</UserContext.Provider>
	);
}

export function useUserContext() {
	return useContext(UserContext);
}
