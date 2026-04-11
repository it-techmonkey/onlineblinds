export interface RoomTypeOption {
  id: string;
  name: string;
}

export const ROOM_TYPE_OPTIONS: RoomTypeOption[] = [
  { id: 'bedroom', name: 'Bedroom' },
  { id: 'family-room', name: 'Family Room' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'bathroom', name: 'Bathroom' },
  { id: 'office', name: 'Office' },
  { id: 'dining-room', name: 'Dining Room' },
  { id: 'living-room', name: 'Living Room' },
  { id: 'other', name: 'Other' },
];
