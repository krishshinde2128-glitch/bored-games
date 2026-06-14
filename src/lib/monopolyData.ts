export type SpaceType = "property" | "railroad" | "utility" | "chance" | "chest" | "tax" | "corner";

export interface MonopolySpace {
  id: number;
  name: string;
  type: SpaceType;
  colorGroup?: string;
  price?: number;
  rent?: number[]; // [base, 1 house, 2 houses, 3 houses, 4 houses, hotel]
  houseCost?: number;
  mortgageValue?: number;
  taxAmount?: number;
}

export const MONOPOLY_BOARD: MonopolySpace[] = [
  { id: 0, name: "GO", type: "corner" },
  { id: 1, name: "Athens", type: "property", colorGroup: "brown", price: 60, rent: [2, 8, 25, 70, 120, 180], houseCost: 40, mortgageValue: 30 },
  { id: 2, name: "Chest", type: "chest" },
  { id: 3, name: "Dublin", type: "property", colorGroup: "brown", price: 60, rent: [3, 15, 45, 135, 240, 340], houseCost: 40, mortgageValue: 30 },
  { id: 4, name: "Tax", type: "tax", taxAmount: 200 },
  { id: 5, name: "Reading", type: "railroad", price: 200, rent: [18, 35, 75, 150], mortgageValue: 100 },
  { id: 6, name: "Bangkok", type: "property", colorGroup: "lightBlue", price: 100, rent: [5, 25, 70, 200, 300, 410], houseCost: 40, mortgageValue: 50 },
  { id: 7, name: "Chance", type: "chance" },
  { id: 8, name: "Prague", type: "property", colorGroup: "lightBlue", price: 100, rent: [5, 25, 70, 200, 300, 410], houseCost: 40, mortgageValue: 50 },
  { id: 9, name: "Budapest", type: "property", colorGroup: "lightBlue", price: 120, rent: [6, 30, 75, 225, 340, 450], houseCost: 40, mortgageValue: 60 },
  
  { id: 10, name: "Jail", type: "corner" },
  { id: 11, name: "Mumbai", type: "property", colorGroup: "pink", price: 140, rent: [8, 40, 110, 340, 470, 560], houseCost: 75, mortgageValue: 70 },
  { id: 12, name: "Electric", type: "utility", price: 150, mortgageValue: 75 },
  { id: 13, name: "Seoul", type: "property", colorGroup: "pink", price: 140, rent: [8, 40, 110, 340, 470, 560], houseCost: 75, mortgageValue: 70 },
  { id: 14, name: "Berlin", type: "property", colorGroup: "pink", price: 160, rent: [9, 45, 135, 375, 525, 675], houseCost: 75, mortgageValue: 80 },
  { id: 15, name: "Penn Rail", type: "railroad", price: 200, rent: [18, 35, 75, 150], mortgageValue: 100 },
  { id: 16, name: "Dubai", type: "property", colorGroup: "orange", price: 180, rent: [10, 50, 150, 410, 560, 710], houseCost: 75, mortgageValue: 90 },
  { id: 17, name: "Chest", type: "chest" },
  { id: 18, name: "Madrid", type: "property", colorGroup: "orange", price: 180, rent: [10, 50, 150, 410, 560, 710], houseCost: 75, mortgageValue: 90 },
  { id: 19, name: "Barcelona", type: "property", colorGroup: "orange", price: 200, rent: [12, 60, 165, 450, 600, 750], houseCost: 75, mortgageValue: 100 },

  { id: 20, name: "Parking", type: "corner" },
  { id: 21, name: "Singapore", type: "property", colorGroup: "red", price: 220, rent: [14, 70, 190, 520, 650, 790], houseCost: 110, mortgageValue: 110 },
  { id: 22, name: "Chance", type: "chance" },
  { id: 23, name: "Rome", type: "property", colorGroup: "red", price: 220, rent: [14, 70, 190, 520, 650, 790], houseCost: 110, mortgageValue: 110 },
  { id: 24, name: "Sydney", type: "property", colorGroup: "red", price: 240, rent: [15, 75, 225, 560, 690, 825], houseCost: 110, mortgageValue: 120 },
  { id: 25, name: "B&O", type: "railroad", price: 200, rent: [18, 35, 75, 150], mortgageValue: 100 },
  { id: 26, name: "Los Angeles", type: "property", colorGroup: "yellow", price: 260, rent: [16, 80, 250, 600, 730, 860], houseCost: 110, mortgageValue: 130 },
  { id: 27, name: "Tokyo", type: "property", colorGroup: "yellow", price: 260, rent: [16, 80, 250, 600, 730, 860], houseCost: 110, mortgageValue: 130 },
  { id: 28, name: "Water", type: "utility", price: 150, mortgageValue: 75 },
  { id: 29, name: "Paris", type: "property", colorGroup: "yellow", price: 280, rent: [18, 90, 270, 640, 770, 900], houseCost: 110, mortgageValue: 140 },

  { id: 30, name: "Go Jail", type: "corner" },
  { id: 31, name: "Pacific", type: "property", colorGroup: "green", price: 300, rent: [20, 100, 300, 680, 830, 960], houseCost: 150, mortgageValue: 150 },
  { id: 32, name: "Carolina", type: "property", colorGroup: "green", price: 300, rent: [20, 100, 300, 680, 830, 960], houseCost: 150, mortgageValue: 150 },
  { id: 33, name: "Chest", type: "chest" },
  { id: 34, name: "Penn", type: "property", colorGroup: "green", price: 320, rent: [21, 115, 340, 750, 900, 1050], houseCost: 150, mortgageValue: 160 },
  { id: 35, name: "Short Line", type: "railroad", price: 200, rent: [18, 35, 75, 150], mortgageValue: 100 },
  { id: 36, name: "Chance", type: "chance" },
  { id: 37, name: "London", type: "property", colorGroup: "darkBlue", price: 350, rent: [26, 130, 375, 825, 975, 1125], houseCost: 150, mortgageValue: 175 },
  { id: 38, name: "Tax", type: "tax", taxAmount: 100 },
  { id: 39, name: "New York", type: "property", colorGroup: "darkBlue", price: 400, rent: [38, 150, 450, 1050, 1275, 1500], houseCost: 150, mortgageValue: 200 }
];

export interface MonopolyCard {
  id: number;
  text: string;
  action: "advance" | "pay" | "receive" | "jail" | "back";
  value?: number;
}

export const CHANCE_DECK: MonopolyCard[] = [
  { id: 1, text: "Advance to GO. Collect $200.", action: "advance", value: 0 },
  { id: 2, text: "Advance to Illinois Ave. If you pass GO, collect $200.", action: "advance", value: 24 },
  { id: 3, text: "Advance to St. Charles Place. If you pass GO, collect $200.", action: "advance", value: 11 },
  { id: 4, text: "Bank pays you dividend of $50.", action: "receive", value: 50 },
  { id: 5, text: "Go back 3 spaces.", action: "back", value: 3 },
  { id: 6, text: "Go directly to Jail. Do not pass GO, do not collect $200.", action: "jail" },
  { id: 7, text: "Make general repairs on all your property: For each house pay $25, for each hotel pay $100.", action: "pay", value: 25 },
  { id: 8, text: "Speeding fine $15.", action: "pay", value: 15 },
  { id: 9, text: "Take a trip to Reading Railroad. If you pass GO, collect $200.", action: "advance", value: 5 },
  { id: 10, text: "Advance to Boardwalk.", action: "advance", value: 39 }
];

export const CHEST_DECK: MonopolyCard[] = [
  { id: 1, text: "Advance to GO. Collect $200.", action: "advance", value: 0 },
  { id: 2, text: "Bank error in your favor. Collect $200.", action: "receive", value: 200 },
  { id: 3, text: "Doctor's fees. Pay $50.", action: "pay", value: 50 },
  { id: 4, text: "From sale of stock you get $50.", action: "receive", value: 50 },
  { id: 5, text: "Go directly to Jail. Do not pass GO, do not collect $200.", action: "jail" },
  { id: 6, text: "Holiday fund matures. Receive $100.", action: "receive", value: 100 },
  { id: 7, text: "Income tax refund. Collect $20.", action: "receive", value: 20 },
  { id: 8, text: "Life insurance matures. Collect $100.", action: "receive", value: 100 },
  { id: 9, text: "Pay hospital fees of $100.", action: "pay", value: 100 },
  { id: 10, text: "Pay school fees of $50.", action: "pay", value: 50 },
  { id: 11, text: "Receive $25 consultancy fee.", action: "receive", value: 25 },
  { id: 12, text: "You have won second prize in a beauty contest. Collect $10.", action: "receive", value: 10 },
  { id: 13, text: "You inherit $100.", action: "receive", value: 100 }
];
