export interface UserInfo {
  id: number;
  username: string;
  email: string;
  name: string;
  displayName: string;
  createdAt: string; // ISO 날짜 문자열
  updatedAt: string;
  phone?: string;
  profileImage?: string;
  country?: string;
  mainAddress?: string;
  subAddress?: string;
  lastLogin?: string; // ISO 날짜 문자열
  isPremium: boolean;
  premiumExpiryDate?: string; // ISO 날짜 문자열
  roleSet: string[];
  isSuperAdmin: boolean;
  sex: string;
  age: number;
}

export interface UserInfoForm {
  username: string;
  name: string;
  password: string;
  email: string;
  displayName: string;
  phone?: string;
  profileImage?: string;
  country?: string;
  mainAddress?: string;
  subAddress?: string;
  sex: string;
  age: number;
}
