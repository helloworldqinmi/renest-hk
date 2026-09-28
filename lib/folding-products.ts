export type FoldingProduct = {
  secondhand?: boolean;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  dimensions: string;
  foldedDimensions: string;
  image: string;
  gallery: string[];
  description: string;
  fitNote: string;
  features: string[];
  badge?: string;
};

// Illustrative HKD demo prices, not live retailer quotes. Delivery and installation excluded.
export const foldingProducts: FoldingProduct[] = [
  {
    slug: "storage-sofa-bed",
    name: "Linen Storage Sofa Bed",
    category: "Sleep & lounge",
    price: 2290,
    dimensions: "198 × 92 × 86 cm",
    foldedDimensions: "Bed: 198 × 142 cm",
    image: "/products/sofa-bed-lifestyle.png",
    gallery: ["/products/sofa-bed-lifestyle.png", "/products/sofa-bed-product.png"],
    description: "A compact two-seat sofa that opens into a guest bed, with bedding storage beneath the seat and oak side shelves for daily essentials.",
    fitNote: "Combines lounge, guest sleep and hidden storage in one footprint.",
    features: ["Pull-out guest bed", "Under-seat storage", "Integrated side shelves", "Performance linen upholstery"],
    badge: "3 functions in 1",
  },
  {
    slug: "nesting-drop-leaf-table",
    name: "Nesting Drop-leaf Dining Set",
    category: "Dining",
    price: 890,
    dimensions: "120 × 78 × 75 cm",
    foldedDimensions: "Folded: 42 × 78 cm",
    image: "/products/nesting-table-lifestyle.png",
    gallery: ["/products/nesting-table-lifestyle.png", "/products/drop-leaf-table-lifestyle.png"],
    description: "A dining table for four whose leaves fold down and whose stools store completely underneath when dinner is over.",
    fitNote: "Gives back nearly one square metre of circulation space when folded.",
    features: ["Seats four", "Two folding leaves", "Four nesting stools", "Solid oak finish"],
    badge: "Best fit",
  },
  {
    slug: "lift-top-coffee-table",
    name: "Lift-top Coffee Table",
    category: "Living",
    price: 590,
    dimensions: "105 × 60 × 46 cm",
    foldedDimensions: "Work height: 66 cm",
    image: "/products/lift-table-lifestyle.png",
    gallery: ["/products/lift-table-lifestyle.png", "/products/lift-table-product.png"],
    description: "A calm coffee table that lifts to desk height and keeps laptops, chargers and small belongings inside its divided storage compartment.",
    fitNote: "Turns the sofa zone into a work or dining surface without another desk.",
    features: ["Soft-lift tabletop", "Hidden divided storage", "Two nesting ottomans", "Rounded child-friendly edges"],
    badge: "Popular",
  },
  {
    slug: "wall-mounted-desk",
    name: "Wall-mounted Folding Desk",
    category: "Work",
    price: 490,
    dimensions: "92 × 58 × 52 cm",
    foldedDimensions: "Closed depth: 18 cm",
    image: "/products/wall-desk-lifestyle.png",
    gallery: ["/products/wall-desk-lifestyle.png", "/products/wall-desk-product.png"],
    description: "A wall cabinet with shelving that opens into a proper laptop desk. The folding stool stores separately when the workday ends.",
    fitNote: "Keeps the floor clear while preserving a dedicated work surface.",
    features: ["18 cm closed depth", "Integrated shelves", "Cable opening", "Folding stool included"],
  },
  {
    slug: "cabinet-workstation",
    name: "Cabinet Workstation",
    category: "Work & storage",
    price: 990,
    dimensions: "78 × 52 × 185 cm",
    foldedDimensions: "Closed depth: 38 cm",
    image: "/products/cabinet-desk-product.png",
    gallery: ["/products/cabinet-desk-product.png"],
    description: "A full-height storage cabinet that conceals a drop-front workstation and its matching stool behind a compact vertical profile.",
    fitNote: "Adds a work zone and vertical storage along one narrow wall.",
    features: ["Concealed desktop", "Vertical book storage", "Stool stores inside", "Soft-close hardware"],
    badge: "Small-space hero",
  },
  {
    slug: "extendable-island-table",
    name: "Extendable Island Table",
    category: "Dining & prep",
    price: 1190,
    dimensions: "160 × 80 × 75 cm",
    foldedDimensions: "Closed: 82 × 80 cm",
    image: "/products/extendable-table-product.png",
    gallery: ["/products/extendable-table-product.png", "/products/island-table-product.png"],
    description: "A compact island with stool storage and side shelves that extends into a dining table for four when friends arrive.",
    fitNote: "Keeps everyday dining compact while retaining an occasional hosting mode.",
    features: ["Sliding extension", "Four nesting stools", "Side storage shelves", "Seats four when open"],
  },
];

foldingProducts.push(
  {
    slug: "folding-shoe-cabinet", name: "Fold-away Entry Cabinet", category: "Entry & storage", price: 390,
    dimensions: "90 × 48 × 65 cm", foldedDimensions: "Closed depth: 20 cm",
    image: "/products/folding-shoe-cabinet.png", gallery: ["/products/folding-shoe-cabinet.png"],
    description: "A slim wall-mounted shoe cabinet with a folding front panel and two shelves for everyday pairs.",
    fitNote: "Keeps shoes off the floor while using a shallow wall footprint.",
    features: ["Two shoe shelves", "Fold-down front panel", "Wall-mounted design", "Oak and charcoal finish"], badge: "New arrival",
  },
  {
    slug: "shelf-workstation", name: "Fold-out Bookshelf Desk", category: "Work & storage", price: 890,
    dimensions: "76 × 62 × 182 cm", foldedDimensions: "Closed depth: 32 cm",
    image: "/products/shelf-workstation.png", gallery: ["/products/shelf-workstation.png"],
    description: "Open shelving, a supported folding desktop and a nesting stool create a work corner that packs away after use.",
    fitNote: "Combines book storage and a laptop workspace along one wall.",
    features: ["Fold-out desktop", "Open display shelves", "Nesting stool", "Metal support legs"], badge: "New arrival",
  },
  {
    slug: "ladder-chair", name: "Convertible Step Chair", category: "Seating", price: 249,
    dimensions: "44 × 52 × 86 cm", foldedDimensions: "Chair and step configuration",
    image: "/products/ladder-chair.png", gallery: ["/products/ladder-chair.png"],
    description: "A compact oak-look chair with a hinged lower frame that transforms into a small household step.",
    fitNote: "One compact piece serves everyday seating and occasional access to shelves.",
    features: ["Convertible frame", "Compact seat", "Metal hinges", "Protective feet"], badge: "Under HK$300",
  },
  {
    slug: "four-stool-coffee-table", name: "Gather Lift-top Table Set", category: "Living", price: 790,
    dimensions: "85 × 85 × 45 cm", foldedDimensions: "Four stools nest around the base",
    image: "/products/four-stool-coffee-table.png", gallery: ["/products/four-stool-coffee-table.png"],
    description: "A square lift-top coffee table with divided storage and four upholstered stools for casual meals and visiting friends.",
    fitNote: "Adds occasional seats without keeping four chairs on the floor.",
    features: ["Lift-top surface", "Four cushioned stools", "Divided storage", "Square compact footprint"], badge: "Seats four",
  },
  {
    slug: "folding-kitchen-cart", name: "Drop-leaf Kitchen Cart", category: "Dining & prep", price: 549,
    dimensions: "130 × 48 × 85 cm", foldedDimensions: "Leaves down: 70 × 48 cm",
    image: "/products/folding-kitchen-cart.png", gallery: ["/products/folding-kitchen-cart.png"],
    description: "A mobile prep station with two folding leaves, cutlery drawers and open shelves for cookware.",
    fitNote: "Roll it where you need an extra worktop, then fold the leaves away.",
    features: ["Two drop leaves", "Rolling castors", "Two drawers", "Open cookware storage"], badge: "Under HK$600",
  },
  {
    slug: "wall-bed", name: "Fold-away Wall Bed", category: "Sleep & storage", price: 2990,
    dimensions: "220 × 205 × 215 cm", foldedDimensions: "Closed depth: 42 cm",
    image: "/products/wall-bed.png", gallery: ["/products/wall-bed.png"],
    description: "A folding bed concept framed by tall storage shelves, designed to return the centre of a room to daytime use.",
    fitNote: "Useful when a guest sleeping space must share a room with daily activities.",
    features: ["Fold-away bed frame", "Side shelving", "Integrated support legs", "Wall anchoring required"], badge: "New arrival",
  },
);

foldingProducts.push(
 {slug:'preowned-oak-desk',name:'Pre-owned Oak Writing Desk',category:'Second-hand furniture',secondhand:true,price:280,dimensions:'115 × 52 × 77 cm',foldedDimensions:'Fixed desk · no folding required',image:'/photos/furniture-study-desk.png',gallery:['/photos/furniture-study-desk.png'],description:'Demo second-hand listing: a freestanding oak writing desk with light signs of use. Confirm actual condition and collection details before purchase.',fitNote:'Replaces the new folding desk in the focus layout and keeps an existing desk in circulation.',features:['Pre-owned · demo listing','Good condition · confirm with seller','Local collection to be arranged','Illustrative image and dimensions'],badge:'Second-hand'},
 {slug:'preowned-desk-chair',name:'Pre-owned Desk Chair',category:'Second-hand furniture',secondhand:true,price:120,dimensions:'44 × 45 × 87 cm',foldedDimensions:'Everyday seating',image:'/photos/furniture-chair.webp',gallery:['/photos/furniture-chair.webp'],description:'Demo second-hand listing: a compact wooden chair for everyday seating. Confirm actual condition and collection details before purchase.',fitNote:'A compact second-hand alternative to the new step chair, with a smaller footprint and a lower demo price.',features:['Pre-owned · demo listing','Good condition · confirm with seller','Local collection to be arranged','Illustrative image and dimensions'],badge:'Second-hand'}
);

export function findFoldingProduct(slug: string) {
  return foldingProducts.find((product) => product.slug === slug);
}
