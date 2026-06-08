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
  { id: 1, name: "Mediterranean Ave", type: "property", colorGroup: "brown", price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgageValue: 30 },
  { id: 2, name: "Community Chest", type: "chest" },
  { id: 3, name: "Baltic Ave", type: "property", colorGroup: "brown", price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgageValue: 30 },
  { id: 4, name: "Income Tax", type: "tax", taxAmount: 200 },
  { id: 5, name: "Reading Railroad", type: "railroad", price: 200, rent: [25, 50, 100, 200], mortgageValue: 100 },
  { id: 6, name: "Oriental Ave", type: "property", colorGroup: "lightBlue", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 },
  { id: 7, name: "Chance", type: "chance" },
  { id: 8, name: "Vermont Ave", type: "property", colorGroup: "lightBlue", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50 },
  { id: 9, name: "Connecticut Ave", type: "property", colorGroup: "lightBlue", price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgageValue: 60 },
  
  { id: 10, name: "Jail / Just Visiting", type: "corner" },
  { id: 11, name: "St. Charles Place", type: "property", colorGroup: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 },
  { id: 12, name: "Electric Company", type: "utility", price: 150, mortgageValue: 75 },
  { id: 13, name: "States Ave", type: "property", colorGroup: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70 },
  { id: 14, name: "Virginia Ave", type: "property", colorGroup: "pink", price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgageValue: 80 },
  { id: 15, name: "Pennsylvania Railroad", type: "railroad", price: 200, rent: [25, 50, 100, 200], mortgageValue: 100 },
  { id: 16, name: "St. James Place", type: "property", colorGroup: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 },
  { id: 17, name: "Community Chest", type: "chest" },
  { id: 18, name: "Tennessee Ave", type: "property", colorGroup: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90 },
  { id: 19, name: "New York Ave", type: "property", colorGroup: "orange", price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgageValue: 100 },

  { id: 20, name: "Free Parking", type: "corner" },
  { id: 21, name: "Kentucky Ave", type: "property", colorGroup: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 },
  { id: 22, name: "Chance", type: "chance" },
  { id: 23, name: "Indiana Ave", type: "property", colorGroup: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110 },
  { id: 24, name: "Illinois Ave", type: "property", colorGroup: "red", price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgageValue: 120 },
  { id: 25, name: "B. & O. Railroad", type: "railroad", price: 200, rent: [25, 50, 100, 200], mortgageValue: 100 },
  { id: 26, name: "Atlantic Ave", type: "property", colorGroup: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
  { id: 27, name: "Ventnor Ave", type: "property", colorGroup: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130 },
  { id: 28, name: "Water Works", type: "utility", price: 150, mortgageValue: 75 },
  { id: 29, name: "Marvin Gardens", type: "property", colorGroup: "yellow", price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140 },

  { id: 30, name: "Go To Jail", type: "corner" },
  { id: 31, name: "Pacific Ave", type: "property", colorGroup: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
  { id: 32, name: "North Carolina Ave", type: "property", colorGroup: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150 },
  { id: 33, name: "Community Chest", type: "chest" },
  { id: 34, name: "Pennsylvania Ave", type: "property", colorGroup: "green", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160 },
  { id: 35, name: "Short Line Railroad", type: "railroad", price: 200, rent: [25, 50, 100, 200], mortgageValue: 100 },
  { id: 36, name: "Chance", type: "chance" },
  { id: 37, name: "Park Place", type: "property", colorGroup: "darkBlue", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgageValue: 175 },
  { id: 38, name: "Luxury Tax", type: "tax", taxAmount: 100 },
  { id: 39, name: "Boardwalk", type: "property", colorGroup: "darkBlue", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgageValue: 200 }
];
