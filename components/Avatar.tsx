import styles from "../styles/components/Avatar.module.css";

const Avatar = ({ src = "", alt = "", ...props }) => (
	<div
		{...props}
		className={styles.avatar}
	>
		{src ? (
			<img
				src={src}
				alt={alt}
			/>
		) : null}
	</div>
);

export default Avatar;
