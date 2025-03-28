export interface CalendarEvent {
	id: string;
	summary: string;
	start: {
	  dateTime?: string;
	  date?: string;
	};
	end: {
	  dateTime?: string;
	  date?: string;
	};
	duration?: {
		hours: number,
		minutes: number
	},
	description?: string;
	link: string;
  }