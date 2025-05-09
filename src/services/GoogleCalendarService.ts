import { CalendarEvent } from "../types/google-calendar";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile";

function calculateDuration(start: string, end: string): { hours: number; minutes: number } {
	// Parse the ISO datetime strings into Date objects
	const startDate = new Date(start);
	const endDate = new Date(end);

	// Calculate difference in milliseconds
	const diffMs = endDate.getTime() - startDate.getTime();

	// Convert to hours and minutes
	const hours = Math.floor(diffMs / (1000 * 60 * 60));
	const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

	return { hours, minutes };
}
class GoogleCalendarService {
	private gapiInited = false;
	private gisInited = false;
	private tokenClient: google.accounts.oauth2.TokenClient | null = null;

	public async init(): Promise<void> {
		return new Promise((resolve) => {
			const scriptGapi = document.createElement("script");
			scriptGapi.src = "https://apis.google.com/js/api.js";
			scriptGapi.async = true;
			scriptGapi.defer = true;
			scriptGapi.onload = () => {
				gapi.load("client", async () => {
					await gapi.client.init({
						apiKey: API_KEY,
						discoveryDocs: [DISCOVERY_DOC],
					});
					this.gapiInited = true;
					if (this.gisInited) resolve();
				});
			};

			const scriptGis = document.createElement("script");
			scriptGis.src = "https://accounts.google.com/gsi/client";
			scriptGis.async = true;
			scriptGis.defer = true;
			scriptGis.onload = () => {
				this.tokenClient = google.accounts.oauth2.initTokenClient({
					client_id: CLIENT_ID,
					scope: SCOPES,
					callback: () => {},
				});
				this.gisInited = true;
				if (this.gapiInited) resolve();
			};

			document.body.appendChild(scriptGapi);
			document.body.appendChild(scriptGis);
		});
	}

	public isSignedIn(): boolean {
		return gapi.client.getToken() !== null;
	}

	public async signIn(): Promise<void> {
		if (!this.tokenClient) {
			throw new Error("Token client not initialized");
		}

		return new Promise((resolve, reject) => {
			(this.tokenClient as any).callback = (resp: any) => {
				if (resp.error !== undefined) {
					reject(resp);
					return;
				}
				this.saveAuthState(); // Save auth state after successful login
				resolve();
			};

			if (gapi.client.getToken() === null) {
				this.tokenClient!.requestAccessToken({ prompt: "consent" });
			} else {
				this.tokenClient!.requestAccessToken({ prompt: "" });
			}
		});
	}

	public async getUserInfo(): Promise<{ name: string; email: string; imageUrl?: string }> {
		try {
			// Make a request to Google's userinfo endpoint
			const response = await gapi.client.request({
				path: "https://www.googleapis.com/oauth2/v2/userinfo",
				method: "GET",
			});

			const userInfo = response.result;
			return {
				name: userInfo.name,
				email: userInfo.email,
				imageUrl: userInfo.picture,
			};
		} catch (error) {
			console.error("Error fetching user info:", error);
			throw error;
		}
	}

	public saveAuthState(): void {
		const token = gapi.client.getToken();
		if (token) {
			localStorage.setItem("googleAuthToken", JSON.stringify(token));
		}
	}

	public loadAuthState(): boolean {
		const savedToken = localStorage.getItem("googleAuthToken");
		if (savedToken) {
			try {
				const token = JSON.parse(savedToken);
				gapi.client.setToken(token);
				return true;
			} catch (e) {
				console.error("Failed to parse saved token", e);
				localStorage.removeItem("googleAuthToken");
			}
		}
		return false;
	}

	public signOut(): void {
		const token = gapi.client.getToken();
		if (token !== null) {
			google.accounts.oauth2.revoke(token.access_token, () => {});
			gapi.client.setToken(null);
			localStorage.removeItem("googleAuthToken");
		}
	}

	public async getEvents(searchName: string): Promise<CalendarEvent[]> {
		try {
			const request = {
				calendarId: "primary",
				showDeleted: false,
				singleEvents: true,
				q: searchName,
				maxResults: 2000,
				orderBy: "updated",
			};

			const response = await gapi.client.calendar.events.list(request);
			const events = response.result.items as any[];

			if (!events || events.length === 0) {
				return [];
			}

			return events.map((event) => {

				const { hours, minutes } = calculateDuration(event.start.dateTime || event.start.date, event.end.dateTime || event.end.date);

				return {
					id: event.id,
					summary: event.summary,
					start: event.start,
					end: event.end,
					duration: {
						hours,
						minutes,
					},
					description: event.description || "",
					link: event.htmlLink
				};
			});
		} catch (error) {
			console.error("Error fetching calendar events:", error);
			throw error;
		}
	}
}

export const calendarService = new GoogleCalendarService();
