import { useEffect, useState } from "react";
import { calendarService } from "../services/GoogleCalendarService";

interface GoogleAuthProps {
	onSignInChange: (isSignedIn: boolean) => void;
}

interface UserInfo {
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
				onSignInChange(signedIn);

				if (signedIn) {
					try {
						const info = await calendarService.getUserInfo();
						setUserInfo(info);
					} catch (err) {
						console.error("Error fetching user info:", err);
					}
				}
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
			onSignInChange(true);

			const info = await calendarService.getUserInfo();
			setUserInfo(info);
		} catch (error) {
			console.error("Authentication failed:", error);
		}
	};

	const handleSignoutClick = () => {
		calendarService.signOut();
		setIsSignedIn(false);
    onSignInChange(false);
    setUserInfo(null);
	};

	if (!isInitialized) {
		return <div>Loading Google API...</div>;
	}

	return (
    <div className="google-auth">
      {userInfo && isSignedIn && (
        <div className="user-info">
          {userInfo.imageUrl && (
            <img 
              src={userInfo.imageUrl} 
              alt={`${userInfo.name}'s profile`} 
              className="user-avatar" 
            />
          )}
          <span className="user-name">Welcome, {userInfo.name}</span>
        </div>
      )}
      
      <div className="google-auth-buttons">
        {!isSignedIn ? (
          <button onClick={handleAuthClick} className="auth-button">
            Sign in with Google Calendar
          </button>
        ) : (
          <button onClick={handleSignoutClick} className="auth-button signout">
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}