export type BcBiz = { id: string; name: string; category: string; rating: number; reviews: number; followers: string; verified: boolean };
export const bcBusinesses: BcBiz[] = [
  { id: "urban", name: "Urban Coffee Co.", category: "Cafes & Restaurants", rating: 4.8, reviews: 245, followers: "12.5K", verified: true },
  { id: "tech", name: "TechSolutions Ltd", category: "IT Services", rating: 4.7, reviews: 189, followers: "8.3K", verified: true },
  { id: "buildpro", name: "BuildPro Services", category: "Construction", rating: 4.6, reviews: 132, followers: "6.7K", verified: true },
  { id: "greenleaf", name: "GreenLeaf Organics", category: "Organic Products", rating: 4.7, reviews: 210, followers: "11.2K", verified: true },
  { id: "stylehub", name: "Style Hub", category: "Fashion & Lifestyle", rating: 4.5, reviews: 98, followers: "7.1K", verified: true },
  { id: "fitzone", name: "FitZone Gym", category: "Health & Fitness", rating: 4.8, reviews: 176, followers: "9.3K", verified: true },
];

export type BcOpp = { id: string; title: string; text: string; expires: string; rating: number; enquiries: number; type: string };
export const bcOpps: BcOpp[] = [
  { id: "1", title: "Strategic Partnership for Growing Brands", text: "Looking for reliable partners to grow our brand presence in Kenya.", expires: "Dec 30, 2026", rating: 4.7, enquiries: 24, type: "Partnerships" },
  { id: "2", title: "Supplier Opportunity – Electronics", text: "Seeking trusted suppliers of quality electronics products.", expires: "Dec 20, 2026", rating: 4.6, enquiries: 18, type: "Supplier" },
  { id: "3", title: "Collaboration Opportunity – Digital Marketing", text: "Partner with us for digital marketing projects and campaigns.", expires: "Dec 20, 2026", rating: 4.6, enquiries: 18, type: "Collaboration" },
  { id: "4", title: "Distribution Opportunity – Eco Products", text: "Seeking distribution partners for our eco-friendly products.", expires: "Dec 25, 2026", rating: 4.5, enquiries: 20, type: "Distribution" },
  { id: "5", title: "Mentorship Opportunity – Business Growth", text: "Experienced entrepreneurs needed to mentor young business owners.", expires: "Dec 22, 2026", rating: 4.9, enquiries: 27, type: "Mentorship" },
  { id: "6", title: "Networking Event – Business Connect", text: "Join our business networking event in Nairobi.", expires: "Dec 18, 2026", rating: 4.7, enquiries: 22, type: "Networking" },
  { id: "7", title: "Investment Interest – Tech Startup", text: "Seeking angel investors for our innovative tech solution.", expires: "Dec 18, 2026", rating: 4.6, enquiries: 19, type: "Partnerships" },
  { id: "8", title: "Collaboration Opportunity – Content Creation", text: "Partner with us to create engaging business content.", expires: "Dec 20, 2026", rating: 4.8, enquiries: 25, type: "Collaboration" },
];

export type BcProd = { id: string; name: string; rating: number; reviews: number; stat: string; price: string; kind: "Product" | "Service" };
export const bcProducts: BcProd[] = [
  { id: "1", name: "Modern Laptops", rating: 4.7, reviews: 124, stat: "2.1K sold", price: "KSh 65,000", kind: "Product" },
  { id: "2", name: "Graphic Design Services", rating: 4.8, reviews: 89, stat: "1.5K hired", price: "KSh 2,500", kind: "Service" },
  { id: "3", name: "Office Printers", rating: 4.6, reviews: 73, stat: "980 sold", price: "KSh 28,000", kind: "Product" },
  { id: "4", name: "Beauty & Wellness Services", rating: 4.9, reviews: 67, stat: "720 booked", price: "KSh 3,000", kind: "Service" },
  { id: "5", name: "Fresh Vegetables", rating: 4.7, reviews: 102, stat: "1.8K sold", price: "KSh 150", kind: "Product" },
  { id: "6", name: "Car Repair Services", rating: 4.6, reviews: 71, stat: "930 hired", price: "KSh 2,000", kind: "Service" },
  { id: "7", name: "Smartphones", rating: 4.7, reviews: 96, stat: "1.3K sold", price: "KSh 25,000", kind: "Product" },
  { id: "8", name: "Interior Design Services", rating: 4.8, reviews: 74, stat: "680 hired", price: "KSh 5,000", kind: "Service" },
];
