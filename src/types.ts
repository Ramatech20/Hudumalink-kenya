export type UserRole = 'customer' | 'provider' | 'seller' | 'admin';
export type ListingType = 'service' | 'product';
export type ListingStatus = 'active' | 'pending' | 'sold' | 'removed';
export type KYCStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface Location {
  county: string;
  town: string;
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  role: UserRole;
  location?: Location;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  emailVerified?: boolean;
  kycStatus?: KYCStatus;
  referralCode: string;
  referredBy?: string;
  referralEarnings: number;
  escrowBalance: number;
  createdAt: string;
}

export interface UserKYC {
  uid: string;
  idType: string;
  idNumber: string;
  idFrontUrl: string;
  idBackUrl?: string;
  selfieUrl: string;
  submittedAt: string;
  rejectionReason?: string;
}

export interface Listing {
  id: string;
  authorId: string;
  title: string;
  description: string;
  price?: number;
  type: ListingType;
  category: string;
  images: string[];
  location: Location;
  contact: {
    phone: string;
    whatsapp?: string;
  };
  stock?: number;
  sizes?: string[];
  specifications?: { [key: string]: string };
  status: ListingStatus;
  isFeatured?: boolean;
  isPromoted?: boolean;
  escrowEnabled?: boolean;
  reportsCount?: number;
  aiModerationResult?: {
    isSafe: boolean;
    reason?: string;
  };
  viewCount?: number;
  createdAt: string;
}

export type TransactionStatus = 'pending' | 'deposited' | 'completed' | 'released' | 'cancelled';

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'completed' | 'released';
  description?: string;
}

export interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: TransactionStatus;
  milestones?: Milestone[];
  delivery?: {
    provider: string;
    price: number;
    status: 'pending' | 'shipped' | 'delivered';
    trackingId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Dispute {
  id: string;
  transactionId: string;
  raisedById: string;
  reason: string;
  details: string;
  evidence: string[]; // URLs to images
  status: 'open' | 'under_review' | 'resolved' | 'refunded';
  resolution?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  method: 'mpesa' | 'bank';
  details: {
    phoneNumber?: string;
    bankName?: string;
    accountNumber?: string;
  };
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
}

export interface SellerStats {
  totalViews: number;
  totalInquiries: number;
  totalSales: number;
  revenue: number;
  activeListings: number;
}

export interface Report {
  id: string;
  listingId: string;
  reporterId: string;
  reason: string;
  details?: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface Review {
  id: string;
  authorId: string;
  targetId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'request';
  read: boolean;
  link?: string;
  createdAt: string;
}
