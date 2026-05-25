export type UserRole = 'customer' | 'provider' | 'seller' | 'admin';
export type ListingType = 'service' | 'product';
export type ListingStatus = 'active' | 'pending' | 'sold' | 'removed';
export type KYCStatus = 'none' | 'pending' | 'verified' | 'rejected';

export interface Location {
  county: string;
  town: string;
  estate?: string;
  lat?: number;
  lng?: number;
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
  isPhoneVerified?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  emailVerified?: boolean;
  kycStatus?: KYCStatus;
  cancellationCount?: number;
  isFlagged?: boolean;
  flagReason?: string;
  completedPaymentsCount?: number;
  dob?: string;
  countyOfBirth?: string;
  residence?: string;
  area?: string;
  gender?: 'male' | 'female' | 'other';
  occupation?: string;
  referralCode: string;
  referredBy?: string;
  referralEarnings: number;
  escrowBalance: number;
  pendingWithdrawalBalance?: number;
  earnings?: {
    totalVolume: number;
    withdrawableBalance: number;
    pendingHoldBalance: number;
  };
  successfulReferrals?: number;
  hasTriggeredReferral?: boolean;
  maxSingleSpend?: number;
  totalSpend?: number;
  deviceFingerprint?: string;
  lastActiveIp?: string;
  metadata?: UserMetadata;
  createdAt: string;
}

export interface UserMetadata {
  healthScore: number;       // 0-100
  responseLatency: number;   // response latency in minutes
  responseRate?: number;     // response rate percentage
  orderCompletionRate?: number; // order completion rate percentage
  disputeRate?: number;      // dispute rate percentage
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
  rating?: number;
  reviewCount?: number;
  escrowEnabled?: boolean;
  reportsCount?: number;
  aiModerationResult?: {
    isSafe: boolean;
    reason?: string;
  };
  viewCount?: number;
  isPromoted?: boolean;
  promotionTier?: 'basic' | 'premium' | 'elite';
  featuredUntil?: string;
  deliveryInfo?: {
    freeDeliveryPlaces?: string[];
    deliveryTimeFrame?: string;
  };
  tipEnabled?: boolean;
  originalPrice?: number;
  offerText?: string;
  giftText?: string;
  isOffer?: boolean;
  offerExpiresAt?: string;
  createdAt: string;
}

export type TransactionStatus = 'pending' | 'deposited' | 'disputed' | 'completed' | 'released' | 'cancelled';

export interface Promotion {
  id: string;
  listingId: string;
  userId: string;
  tier: 'basic' | 'premium' | 'elite';
  amount: number;
  durationDays: number;
  status: 'pending' | 'completed' | 'expired';
  checkoutRequestId?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'completed' | 'released';
  description?: string;
}

export interface EscrowMilestone {
  phaseId: number;
  percentage: number;
  amount: number;
  status: 'held' | 'released' | 'disputed';
}

export enum DisputeTemplate {
  PARTIAL_REFUND_INCOMPLETE = 'PARTIAL_REFUND_INCOMPLETE',
  FULL_RELEASE_EVIDENCE_INSUFFICIENT = 'FULL_RELEASE_EVIDENCE_INSUFFICIENT',
  FULL_REFUND_NO_CONTACT = 'FULL_REFUND_NO_CONTACT'
}

export interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  status: TransactionStatus;
  cancellationReason?: string;
  cancelledBy?: string;
  milestones?: Milestone[];
  escrowMilestones?: EscrowMilestone[];
  expectedDeliveryDate?: string;
  providerETA?: string;
  delivery?: {
    provider: string;
    price: number;
    status: 'pending' | 'shipped' | 'delivered';
    trackingId?: string;
  };
  tipAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Dispute {
  id: string;
  transactionId: string;
  raisedById: string;
  reason: string;
  details: string;
  evidenceUrls: string[]; // URLs to images
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

export interface Appeal {
  id: string;
  userId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
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
  listingId?: string;
  unreadCount?: { [userId: string]: number };
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
