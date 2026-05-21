export type ProductItem = {
  title: string;
  image: string;
  price: string;
  handle: string;
  description: string;
};

export type Booking = {
  summary: string;
  start: string;
  end: string;
  attendees?: string;
  description?: string;
  status: string;
  meet_url?: string;
};

export type CalendarEvent = {
  summary: string;
  start: string;
  end: string;
  status: string;
};

export type Task = {
  title: string;
  notes?: string;
};

export type Order = {
  id: string;
  name: string;
  total_price: string;
  created_at: string;
  status: string;
};

export type GenUIData = {
  message?: string;
  products?: ProductItem[];
  booking?: Booking;
  events?: CalendarEvent[];
  task?: Task;
  orders?: Order[];
};

export type Message = {
  id: string;
  role: "user" | "model" | "system" | "tool";
  text: string;
  toolName?: string;
  toolDone?: boolean;
  genUI?: GenUIData;
};
