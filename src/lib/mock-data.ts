export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo: string;
};

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
};


export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  tags: string[];
  allergens?: string[];
  spiceLevels?: string[];
};

export const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: "1",
    slug: "the-golden-spoon",
    name: "The Golden Spoon",
    description: "Explore our exquisite menu and savor the finest flavors.",
    logo: "/restaurant-logo.svg",
  },
];

export const MOCK_CATEGORIES: MenuCategory[] = [
  { id: "1", name: "Main Dining", slug: "main-dining" },
  { id: "2", name: "Breakfast", slug: "breakfast" },
  { id: "3", name: "Drinks", slug: "drinks" },
  { id: "4", name: "Vegan Menu", slug: "vegan-menu" },
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: "1",
    name: "Vegan Spring Rolls",
    description:
      "Crispy spring rolls filled with fresh vegetables and served with a sweet chili dipping sauce.",
    price: 8.99,
    image: "/menu-items/spring-rolls.jpg",
    categoryId: "1",
    tags: ["VEGAN", "Appetizers"],
  },
  {
    id: "2",
    name: "Grilled Salmon with Quinoa",
    description:
      "Freshly grilled salmon fillet served with a side of quinoa and steamed asparagus.",
    price: 16.99,
    image: "/menu-items/salmon.jpg",
    categoryId: "1",
    tags: ["GLUTEN-FREE", "Main Courses"],
  },
  {
    id: "3",
    name: "Mushroom Risotto",
    description:
      "Creamy risotto with a mix of wild mushrooms, topped with parmesan cheese.",
    price: 14.99,
    image: "/menu-items/risotto.jpg",
    categoryId: "1",
    tags: ["VEGETARIAN", "Main Courses"],
  },
  {
    id: "4",
    name: "Spicy Chicken Tacos",
    description:
      "Three soft tacos filled with spicy grilled chicken, shredded lettuce, and a tangy salsa.",
    price: 12.99,
    image: "/menu-items/tacos.jpg",
    categoryId: "1",
    tags: ["SPICY", "Main Courses"],
  },
  {
    id: "5",
    name: "Classic Cheeseburger",
    description:
      "Juicy beef patty topped with melted cheddar cheese, lettuce, tomato, and pickles on a toasted bun.",
    price: 10.99,
    image: "/menu-items/burger.jpg",
    categoryId: "1",
    tags: ["POPULAR", "Main Courses"],
  },
  {
    id: "6",
    name: "Spicy Rigatoni Vodka",
    description:
      "Rigatoni pasta with a spicy vodka sauce, topped with fresh basil and parmesan cheese.",
    price: 18.99,
    image: "/menu-items/rigatoni.jpg",
    categoryId: "1",
    tags: ["SPICY", "Main Courses", "Desserts"],
    allergens: ["Contains dairy, gluten, and may contain traces of nuts."],
    spiceLevels: ["Mild", "Medium", "Hot"],
  },
];
