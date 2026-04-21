
export type TripType = {
  id: string;
  label: string;
  base: number;
  perkm: number;
  icon: string;
};

export const TRIP_TYPES: TripType[] = [
  { id: 'bike', label: 'Bike Taxi', base: 20, perkm: 5, icon: 'Bike' },
  { id: 'auto', label: 'Auto Rickshaw', base: 40, perkm: 10, icon: 'CarFront' },
  { id: 'cab', label: 'Economy Cab', base: 70, perkm: 15, icon: 'Car' }
];

export type CarType = {
  id: string;
  label: string;
  multiplier: number;
};

export const CAR_TYPES: CarType[] = [
  { id: 'standard', label: 'Standard', multiplier: 1.0 },
  { id: 'luxury', label: 'Luxury (AC)', multiplier: 1.4 },
];

export const UPI_ID = "91XXXXXXXXXX@ybl";
export const WHATSAPP_NUMBER = "917787860016";
export const DHANBAD_CENTER = { lat: 23.7957, lng: 86.4304 };
