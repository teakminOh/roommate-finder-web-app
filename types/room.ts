export interface Room {
  id: string;
  propertyType: string;
  aboutProperty: string;
  aboutRoomies: string;
  availableFrom: string;
  bathroomType: string;
  budget: number;
  location: string;
  images: string[];

  // Additional room-specific fields
  catFriendly: boolean;
  childrenFriendly: boolean;
  completedProfile: boolean;
  dogFriendly: boolean;
  email: string;
  internetIncluded: boolean;
  isAccessible: boolean;
  isFurnished: boolean;
  isPrivateRoom: boolean;
  parkingAvailable: boolean;
  petsAllowed: boolean;
  preferredGender: string;
  rentWithBills: boolean;
  roomType: string;
  securityDeposit: number;
  studentsWelcome: boolean;
  updatedAt: Date;
  zip: string;
}