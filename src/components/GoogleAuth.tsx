import { useEffect, useState } from "react";
import { calendarService } from "../services/GoogleCalendarService";

interface GoogleAuthProps {
	onSignInChange: (isSignedIn: boolean, userInfo: UserInfo | null) => void;
}

export interface UserInfo {
	name: string;
	email: string;
	imageUrl?: string;
}

export function GoogleAuth({ onSignInChange }: GoogleAuthProps) {
	const [isInitialized, setIsInitialized] = useState(false);
	const [isSignedIn, setIsSignedIn] = useState(false);
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

	useEffect(() => {
		const initGoogleApi = async () => {
			try {
				await calendarService.init();
				setIsInitialized(true);

				// First check for saved token
				let signedIn = calendarService.loadAuthState();

				// If no stored token, check if current session is authenticated
				if (!signedIn) {
					signedIn = calendarService.isSignedIn();
				}

				setIsSignedIn(signedIn);

				if (signedIn) {
					try {
						const info = await calendarService.getUserInfo();
						setUserInfo(info);
					} catch (err) {
						console.error("Error fetching user info:", err);
					}
				}

				onSignInChange(signedIn, userInfo);
			} catch (error) {
				console.error("Failed to initialize Google API:", error);
			}
		};

		initGoogleApi();
	}, [onSignInChange]);

	const handleAuthClick = async () => {
		try {
			await calendarService.signIn();
			setIsSignedIn(true);
			onSignInChange(true, userInfo);

			const info = await calendarService.getUserInfo();
			setUserInfo(info);
		} catch (error) {
			console.error("Authentication failed:", error);
		}
	};

	const handleSignoutClick = () => {
		calendarService.signOut();
		setIsSignedIn(false);
		onSignInChange(false, null);
		setUserInfo(null);
	};

	if (!isInitialized) {
		return <div>Loading Google API...</div>;
	}

	return (
		<div className="google-auth">
			{userInfo && isSignedIn && (
				<div className="user-info">
					{userInfo.imageUrl && <img src={userInfo.imageUrl} alt={`${userInfo.name}'s profile`} className="user-avatar" />}
					<span className="user-name">
						Welcome
						<br />
						<strong>{userInfo.name}</strong>
					</span>
				</div>
			)}

			<div className="google-auth-buttons">
				{!isSignedIn ? (
					<button onClick={handleAuthClick} className="auth-button">
						Sign In
					</button>
				) : (
					<button onClick={handleSignoutClick} className={`auth-button signout ${!userInfo ? "tokenError" : ""}`}>
						Sign Out
					</button>
				)}
			</div>
		</div>
	);
}
