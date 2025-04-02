export interface Roommate {
  id: string;
  firstName: string;
  age: string;
  bio: string;
  budget: string;
  location: string;
  student: boolean;
  gender: string;
  images: string[];

  phoneNumber: string;
  alcoholUse: string;
  bedTime: string;
  childrenStatus: string;
  cleaningFrequency: string;
  cleanlinessLevel: string;
  completedProfile: boolean;
  cookingFrequency: string;
  dayPreference: string;
  dietaryPreference: string;
  email: string;
  groupMembers: any[]; // adjust if you have a structure for group members
  guestFrequency: string;
  hasCat: boolean;
  hasDog: boolean;
  hasOtherPets: boolean;
  hasPets: boolean;
  isGroup: boolean;
  isSmoker: boolean;
  livingArrangement: string;
  noiseTolerance: string;
  occupation: string;
  preferredAgeRange: string;
  preferredGender: string;
  preferredMoveDate: string; // or Date if you parse it
  selectedFaculty: string;
  selectedSchool: string;
  studyProgram: string;
  updatedAt: Date; // or Firebase Timestamp, depending on how you handle it
  wakeTime: string;
  workHome: string;
}