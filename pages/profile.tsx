import styles from "../styles/pages/Profile.module.css";

import { useEffect, useState } from "react";
import { useUserContext } from "../UserProvider";
import Head from "next/head";
import Layout from "../components/Layout";
import Input from "../components/Input";
import withAuth from "../withAuth";

import { gql, useMutation } from "@apollo/client";
import { toast } from "react-hot-toast";
import { useNhostClient } from "@nhost/nextjs";
import Avatar from "../components/Avatar";

const UPDATE_USER_MUTATION = gql`
	mutation ($id: uuid!, $displayName: String!, $metadata: jsonb) {
		updateUser(
			pk_columns: { id: $id }
			_set: { displayName: $displayName, metadata: $metadata }
		) {
			id
			displayName
			metadata
		}
	}
`;

const Profile = () => {
	const { storage } = useNhostClient();
	const { user } = useUserContext();

	const [firstName, setFirstName] = useState(user?.metadata?.firstName ?? "");
	const [lastName, setLastName] = useState(user?.metadata?.lastName ?? "");
	const [avatarId, setAvatarId] = useState(user?.metadata?.avatarId ?? null);
	const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? null);

	const isFirstNameDirty = firstName !== user?.metadata?.firstName;
	const isLastNameDirty = lastName !== user?.metadata?.lastName;
	const isPictureDirty = avatarId !== user?.metadata?.avatarId;
	const isProfileFormDirty = isFirstNameDirty || isLastNameDirty || isPictureDirty;

	const [mutateUser, { loading: updatingProfile }] = useMutation(UPDATE_USER_MUTATION);

	const updateUserProfile = async (e) => {
		e.preventDefault();

		try {
			if (isPictureDirty) {
				try {
					await storage.delete({ fileId: user?.metadata?.avatarId });
				} catch (error) {
					console.log(error);
				}
			}

			await mutateUser({
				variables: {
					id: user.id,
					displayName: `${firstName} ${lastName}`.trim(),
					metadata: {
						firstName,
						lastName,
						avatarId,
					},
				},
			});
			toast.success("Updated successfully", { id: "updateProfile" });
		} catch (error) {
			toast.error("Unable to update profile", { id: "updateProfile" });
		}
	};

	const uploadFile = async (e) => {
		e.preventDefault();

		try {
			const file = e.target.files[0];
			const { error, fileMetadata } = await storage.upload({ file });
			if (fileMetadata) {
				const { id } = fileMetadata;
				setAvatarId(id);
				const { presignedUrl } = await storage.getPresignedUrl({
					fileId: id,
				});
				setAvatarUrl(presignedUrl.url);
			}

			if (error) {
				toast.error("Unable to upload file", { id: "uploadFile" });
			}
		} catch (error) {
			toast.error("Unable to upload file", { id: "uploadFile" });
		}
	};

	return (
		<Layout>
			<Head>
				<title>Profile - Nhost</title>
			</Head>

			<div className={styles.container}>
				<div className={styles.info}>
					<h2>Profile</h2>
					<p>Update your personal information.</p>
				</div>

				<div className={styles.card}>
					<form
						onSubmit={updateUserProfile}
						className={styles.form}
					>
						<div className={styles["form-fields"]}>
							<div>
								{(avatarUrl || user?.avatarUrl) && (
									<img
										src={avatarUrl ?? user?.avatarUrl}
										alt="Avatar"
										width={100}
										height={100}
										className={styles.avatar}
									/>
								)}
								{(!isPictureDirty || !avatarId) && (
									<Input
										label="Avatar"
										type="file"
										name="avatar"
										id="avatar"
										placeholder="Upload avatar"
										onChange={(e) => uploadFile(e)}
										disabled={isPictureDirty && avatarId}
									/>
								)}
							</div>
							<div className={styles["input-group"]}>
								<Input
									type="text"
									label="First name"
									value={firstName}
									onChange={(e) => setFirstName(e.target.value)}
									required
								/>
								<Input
									type="text"
									label="Last name"
									value={lastName}
									onChange={(e) => setLastName(e.target.value)}
									required
								/>
							</div>
							<div className={styles["input-email-wrapper"]}>
								<Input
									type="email"
									label="Email address"
									value={user?.email}
									readOnly
								/>
							</div>
						</div>

						<div className={styles["form-footer"]}>
							<button
								type="submit"
								disabled={!isProfileFormDirty}
								className={styles.button}
							>
								Update
							</button>
						</div>
					</form>
				</div>
			</div>
		</Layout>
	);
};

export default withAuth(Profile);
