import { CalendarEvent } from "../types/google-calendar";

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY as string;
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

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
			// Using the original approach but with type assertion
			(this.tokenClient as any).callback = (resp: any) => {
				if (resp.error !== undefined) {
					reject(resp);
					return;
				}
				resolve();
			};

			if (gapi.client.getToken() === null) {
				this.tokenClient!.requestAccessToken({ prompt: "consent" });
			} else {
				this.tokenClient!.requestAccessToken({ prompt: "" });
			}
		});
	}

	public signOut(): void {
		const token = gapi.client.getToken();
		if (token !== null) {
			google.accounts.oauth2.revoke(token.access_token, () => {});
			gapi.client.setToken(null);
		}
	}

	public async getEvents(searchName: string, maxResults: number = 10): Promise<CalendarEvent[]> {
		try {
			const request = {
				calendarId: "primary",
				showDeleted: false,
				singleEvents: true,
				q: searchName,
				maxResults: maxResults,
				orderBy: "updated",
			};

			const response = await gapi.client.calendar.events.list(request);
			const events = response.result.items as any[];

			if (!events || events.length === 0) {
				return [];
			}

			return events.map((event) => {
				const startDateTime = event.start.dateTime ? new Date(event.start.dateTime) : null;
				const endDateTime = event.end.dateTime ? new Date(event.end.dateTime) : null;

				let duration = 0;
				if (startDateTime && endDateTime) {
					duration = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60); // Convert ms to hours
				}

				return {
					id: event.id,
					summary: event.summary,
					start: event.start,
					end: event.end,
					duration: parseFloat(duration.toFixed(2)),
				};
			});
		} catch (error) {
			console.error("Error fetching calendar events:", error);
			throw error;
		}
	}
}

export const calendarService = new GoogleCalendarService();
