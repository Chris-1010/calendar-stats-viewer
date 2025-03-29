import { useState } from "react";
import "./App.css";
import { GoogleAuth, UserInfo } from "./components/GoogleAuth";
import { CalendarEvents } from "./components/CalendarEvents";

function App() {
	const [isSignedIn, setIsSignedIn] = useState(false);
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
	const [searchEvent, setSearchEvent] = useState("");
	const [searchSubmitted, setSearchSubmitted] = useState("");

	const handleSignInChange = (signedIn: boolean, userInfo: UserInfo | null) => {
		setIsSignedIn(signedIn);
		setUserInfo(userInfo);
	};

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSearchSubmitted(searchEvent);
	};

	if (!isSignedIn)
		return (
			<div className="login-container">
				<h1>Google Calendar Statistics Viewer</h1>
				<h2>Login to Continue</h2>
				<GoogleAuth onSignInChange={handleSignInChange} />
			</div>
		);

	return (
		<>
			<header>
				<h1>Google Calendar Statistics Viewer</h1>
				<GoogleAuth onSignInChange={handleSignInChange} />
			</header>
			<main className="calendar-container">
				<div className="search-container">
					<form onSubmit={handleSearchSubmit}>
						<input type="text" value={searchEvent} onChange={(e) => setSearchEvent(e.target.value)} placeholder="Search for events" />
						<button type="submit">Find Events</button>
					</form>
				</div>

				<CalendarEvents userEmail={userInfo ? userInfo.email : null} searchQuery={searchSubmitted} />
			</main>
			<footer></footer>
		</>
	);
}

export default App;
