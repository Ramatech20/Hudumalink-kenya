export const KENYAN_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Uasin Gishu", "Kakamega", "Kiambu", "Machakos", "Kajiado", "Kilifi", "Kwale", "Laikipia", "Meru", "Nyeri", "Murang'a", "Trans Nzoia", "Bungoma", "Siaya", "Homa Bay", "Migori", "Kisii", "Nyamira", "Kericho", "Bomet", "Narok", "Embu", "Tharaka-Nithi", "Kitui", "Makueni", "Nyandarua", "Kirinyaga", "Taita Taveta", "Tana River", "Lamu", "Garissa", "Wajir", "Mandera", "Marsabit", "Isiolo", "Turkana", "West Pokot", "Samburu", "Elgeyo-Marakwet", "Nandi", "Baringo", "Vihiga", "Busia"
];

export const CATEGORIES = {
  services: [
    "Plumbing", "Electrical", "Carpentry", "Masonry & Construction",
    "House Cleaning", "Laundry", "Cooking & Catering",
    "Tutors & Education", "Music Lessons", "Driving School",
    "Hairdressing & Barber", "Makeup & Beauty", "Massage & Wellness",
    "Graphic Design", "Web Development", "Digital Marketing",
    "Photography & Videography", "DJ & Entertainment", "Event Planning",
    "Mechanic & Auto Repair", "Car Wash", "Taxi & Transport",
    "Legal Services", "Accounting & Audit", "Business Consulting",
    "Gardening & Landscaping", "Security Services", "Tailoring & Fashion Design"
  ],
  marketplace: [
    "Electronics (Phones, Laptops, TVs)",
    "Fashion (Clothes, Shoes, Accessories)",
    "Furniture (Sofas, Beds, Tables)",
    "Home Appliances (Fridges, Microwaves)",
    "Agriculture & Farm Produce",
    "Construction Materials",
    "Vehicles & Automotive Parts",
    "Real Estate (Rent & Sale)",
    "Health & Beauty Products",
    "Groceries & Foodstuffs",
    "Books & Stationery",
    "Sports & Leisure",
    "Toys & Games",
    "Baby Products"
  ]
};

export const TOWNS: Record<string, string[]> = {
  "Nairobi": ["Nairobi CBD", "Westlands", "Kilimani", "Karen", "Lang'ata", "Kasarani", "Embakasi", "Roysambu", "Dagoretti", "Githurai", "Kahawa West", "South C", "South B"],
  "Mombasa": ["Mombasa Island", "Nyali", "Bamburi", "Likoni", "Changamwe", "Kisauni", "Mtwapa", "Shanzu"],
  "Kisumu": ["Kisumu CBD", "Milimani", "Kondele", "Manyatta", "Nyalenda", "Kibos", "Maseno"],
  "Nakuru": ["Nakuru CBD", "Lanet", "Njoro", "Gilgil", "Naivasha", "Molo", "Bahati"],
  "Uasin Gishu": ["Eldoret CBD", "Langas", "Huruma", "Kimumu", "Burnt Forest", "Turbo", "Munyaka", "Kapkugerwet", "Moiben"],
  "Kakamega": ["Kakamega CBD", "Mumias", "Butere", "Malava", "Lugari"],
  "Kiambu": ["Thika", "Kiambu Town", "Ruiru", "Kikuyu", "Limuru", "Githunguri", "Juja", "Karuri"]
};

export const PROMOTION_TIERS = [
  {
    id: 'basic',
    name: 'Basic Boost',
    price: 500,
    duration: 7,
    description: 'Boost your listing to the top of search results for 7 days.',
    features: ['Top of search results', '7 days duration', 'Standard badge']
  },
  {
    id: 'premium',
    name: 'Premium Exposure',
    price: 1500,
    duration: 30,
    description: 'Maximum visibility for 30 days with a premium badge.',
    features: ['Top of search results', '30 days duration', 'Premium badge', 'Social media shoutout']
  },
  {
    id: 'elite',
    name: 'Elite Seller',
    price: 5000,
    duration: 90,
    description: 'The ultimate promotion for serious sellers. 90 days of elite status.',
    features: ['Top of search results', '90 days duration', 'Elite badge', 'Priority support', 'Featured on homepage']
  }
];
