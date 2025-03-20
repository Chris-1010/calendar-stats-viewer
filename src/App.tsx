import { useState } from "react";
import "./App.css";
import { GoogleAuth } from "./components/GoogleAuth";
import { CalendarEvents } from "./components/CalendarEvents";

function App() {
	const [isSignedIn, setIsSignedIn] = useState(false);
	const [searchEvent, setSearchEvent] = useState("");
	const [searchSubmitted, setSearchSubmitted] = useState("");

	const handleSignInChange = (signedIn: boolean) => {
		setIsSignedIn(signedIn);
	};

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSearchSubmitted(searchEvent);
	};

	if (!isSignedIn)
		return (
			<div className="login-container">
				<h1>Login to Continue</h1>
				<GoogleAuth onSignInChange={handleSignInChange} />
			</div>
		);

	return (
		<main className="calendar-container">
			<h1>Google Calendar Integration</h1>
			<GoogleAuth onSignInChange={handleSignInChange} />

			<div className="search-container">
				<form onSubmit={handleSearchSubmit}>
					<input
						type="text"
						value={searchEvent}
						onChange={(e) => setSearchEvent(e.target.value)}
						placeholder="Search for an event name to calculate total hours"
					/>
					<button type="submit">Calculate Hours</button>
				</form>
			</div>

			<CalendarEvents searchQuery={searchSubmitted} />
		</main>
	);
}

export default App;
