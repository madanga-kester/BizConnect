export type PageKey = "home" | "discover" | "businesses" | "catalog" | "opportunities" | "messages" | "notifications" | "analytics" | "settings";

export type Business = { id: string; name: string; category: string; location: string; rating: number; reviews: number; color: string; initials: string; followers: string; verified?: boolean };
export type Product = { id: string; name: string; kind: "Product" | "Service"; business: string; price: string; category: string; image: string; accent: string };
export type Opportunity = { id: string; title: string; category: string; description: string; budget: string; posted: string; tags: string[] };
export type Conversation = { id: string; name: string; company: string; preview: string; time: string; unread?: number; active?: boolean; color: string };

export const businesses: Business[] = [
  { id: "urban", name: "Urban Coffee Co.", category: "Food & Beverage", location: "Westlands, Nairobi", rating: 4.8, reviews: 126, color: "#9d5d32", initials: "UC", followers: "1.8K", verified: true },
  { id: "tech", name: "TechSolutions Ltd", category: "Technology", location: "Kilimani, Nairobi", rating: 4.7, reviews: 89, color: "#277cb4", initials: "TS", followers: "2.4K", verified: true },
  { id: "buildpro", name: "BuildPro Services", category: "Construction", location: "Karen, Nairobi", rating: 4.6, reviews: 64, color: "#5d7044", initials: "BP", followers: "980" },
  { id: "greenleaf", name: "GreenLeaf Organics", category: "Agriculture", location: "Ruiru, Kiambu", rating: 4.9, reviews: 113, color: "#2e9b69", initials: "GO", followers: "3.1K", verified: true },
  { id: "stylehub", name: "Style Hub", category: "Fashion & Lifestyle", location: "CBD, Nairobi", rating: 4.5, reviews: 47, color: "#de7292", initials: "SH", followers: "740" },
  { id: "fitzone", name: "FitZone Gym", category: "Health & Fitness", location: "Lavington, Nairobi", rating: 4.7, reviews: 76, color: "#6171d7", initials: "FZ", followers: "1.2K" },
];

export const products: Product[] = [
  { id: "p1", name: "Modern Laptop", kind: "Product", business: "TechSolutions Ltd", price: "KSh 85,000", category: "Electronics", image: "laptop", accent: "#dcecff" },
  { id: "p2", name: "Graphic Design Services", kind: "Service", business: "Creative Studio", price: "From KSh 15,000", category: "Design", image: "design", accent: "#ffe5d5" },
  { id: "p3", name: "Office Printers", kind: "Product", business: "TechSolutions Ltd", price: "KSh 32,000", category: "Office", image: "printer", accent: "#e5e8ee" },
  { id: "p4", name: "Beauty & Wellness Services", kind: "Service", business: "Style Hub", price: "From KSh 2,500", category: "Wellness", image: "wellness", accent: "#fce4eb" },
  { id: "p5", name: "Fresh Vegetables", kind: "Product", business: "GreenLeaf Organics", price: "From KSh 250", category: "Groceries", image: "vegetables", accent: "#dff4df" },
  { id: "p6", name: "Car Repair Services", kind: "Service", business: "BuildPro Services", price: "From KSh 1,500", category: "Automotive", image: "car", accent: "#f8e7ce" },
  { id: "p7", name: "Smartphones", kind: "Product", business: "TechSolutions Ltd", price: "From KSh 18,000", category: "Electronics", image: "phone", accent: "#e4e0fa" },
  { id: "p8", name: "Interior Design Services", kind: "Service", business: "Creative Studio", price: "From KSh 20,000", category: "Design", image: "interior", accent: "#eadfd4" },
];

export const opportunities: Opportunity[] = [
  { id: "o1", title: "Strategic Partnership", category: "Partnership", description: "Looking for growing Kenyan businesses to collaborate on a new local delivery network.", budget: "KSh 100K–500K", posted: "2h ago", tags: ["Logistics", "Growth"] },
  { id: "o2", title: "Supplier Opportunity", category: "Supply", description: "Seeking reliable suppliers of quality office and hospitality equipment.", budget: "KSh 50K–250K", posted: "4h ago", tags: ["Suppliers", "B2B"] },
  { id: "o3", title: "Collaboration Opportunity", category: "Collaboration", description: "Partner with a community-first brand on an upcoming founder event series.", budget: "Flexible", posted: "6h ago", tags: ["Events", "Community"] },
  { id: "o4", title: "Distribution Opportunity", category: "Distribution", description: "Expand a proven consumer product into new neighbourhoods across Nairobi.", budget: "KSh 250K+", posted: "1d ago", tags: ["Retail", "Nairobi"] },
  { id: "o5", title: "Mentorship Opportunity", category: "Mentorship", description: "Experienced operators are opening a small cohort for early-stage founders.", budget: "No cost", posted: "1d ago", tags: ["Learning", "Founders"] },
  { id: "o6", title: "Networking Event", category: "Networking", description: "Meet local businesses, creators and service providers at our monthly community evening.", budget: "Free", posted: "2d ago", tags: ["Meetup", "Connect"] },
];

export const conversations: Conversation[] = [
  { id: "c1", name: "Urban Coffee Co.", company: "Business enquiry", preview: "That's great! We would love to partner…", time: "10:32 AM", unread: 2, active: true, color: "#9d5d32" },
  { id: "c2", name: "TechSolutions Ltd", company: "Catalogue enquiry", preview: "Here are the specs you asked for.", time: "Yesterday", color: "#277cb4" },
  { id: "c3", name: "GreenLeaf Organics", company: "Direct message", preview: "Thanks for reaching out!", time: "Monday", color: "#2e9b69" },
  { id: "c4", name: "Mary Wanjiku", company: "Founder network", preview: "Would you be open to a quick call?", time: "Sun", color: "#de7292" },
  { id: "c5", name: "David Otieno", company: "Direct message", preview: "Let me send the proposal through.", time: "Sat", color: "#6171d7" },
];

export const activities = [
  { title: "TechSolutions Ltd posted a new update", detail: "New solutions designed for growing Kenyan businesses", time: "12 min ago", color: "#277cb4" },
  { title: "Urban Coffee Co. replied to your review", detail: "Thank you for sharing your experience", time: "1h ago", color: "#9d5d32" },
  { title: "A new opportunity matches your interests", detail: "Strategic Partnership · Logistics", time: "3h ago", color: "#0a8f62" },
];
