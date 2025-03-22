import { useEffect, useState } from 'react';
import { calendarService } from '../services/GoogleCalendarService';

interface GoogleAuthProps {
  onSignInChange: (isSignedIn: boolean) => void;
}

export function GoogleAuth({ onSignInChange }: GoogleAuthProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

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
      } catch (error) {
        console.error('Failed to initialize Google API:', error);
      }
    };
  
    initGoogleApi();
  }, [onSignInChange]);
  

  const handleAuthClick = async () => {
    try {
      await calendarService.signIn();
      setIsSignedIn(true);
      onSignInChange(true);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  const handleSignoutClick = () => {
    calendarService.signOut();
    setIsSignedIn(false);
    onSignInChange(false);
  };

  if (!isInitialized) {
    return <div>Loading Google API...</div>;
  }

  return (
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
  );
}