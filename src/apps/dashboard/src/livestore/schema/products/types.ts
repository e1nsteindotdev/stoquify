import {
  productsTable,
  productImagesTable,
  variantsTable,
  variantOptionsTable,
  skusTable,
  categoriesTable,
  collectionsTable,
  collectionProductsTable,
} from "./tables";

export type Product = {
  id: string;
  shop_id: string;
  title: string;
  desc: string | null;
  category_id: string;
  price: number;
  cost: number | null;
  status: string;
  discount: number | null;
  oldPrice: number | null;
  stockingStrategy: string;
  quantity: number | null;
  createdAt: Date;
  deletedAt: Date | null;
};

export type ProductImage = {
  id: string;
  shop_id: string;
  product_id: string;
  url: string;
  localUrl: string | null;
  displayOrder: number;
  hidden: number;
  createdAt: Date;
  deletedAt: Date | null;
};

export type Variant = {
  id: string;
  shop_id: string;
  product_id: string;
  name: string;
  displayOrder: number;
  createdAt: Date;
  deletedAt: Date | null;
};

export type VariantOption = {
  id: string;
  shop_id: string;
  variant_id: string;
  value: string;
  createdAt: Date;
  deletedAt: Date | null;
};

export type SKU = {
  id: string;
  shop_id: string;
  product_id: string;
  quantity: number;
  createdAt: Date;
  deletedAt: Date | null;
};

export type SKUOption = {
  id: string;
  shop_id: string;
  sku_id: string;
  option_id: string;
  createdAt: Date;
  deletedAt: Date | null;
};

export type Category = {
  id: string;
  shop_id: string;
  name: string;
  createdAt: Date;
  deletedAt: Date | null;
};

export type Collection = {
  id: string;
  shop_id: string;
  name: string;
  createdAt: Date;
  deletedAt: Date | null;
};

export type CollectionProduct = {
  id: string;
  shop_id: string;
  collection_id: string;
  product_id: string;
  createdAt: Date;
  deletedAt: Date | null;
};

export type ProductWithDetails = Omit<
  Product,
  "category_id" | "discount" | "deletedAt"
> & {
  category_id: string | null;
  discount: number | null;
  category: Pick<Category, "id" | "name"> | null;
  images: Array<
    Pick<ProductImage, "id" | "url" | "localUrl" | "displayOrder" | "hidden">
  >;
  collections: Array<{
    id: CollectionProduct["id"];
    name: Collection["name"];
    collection_product_id: CollectionProduct["id"];
  }>;
  variants: Array<{
    id: Variant["id"];
    name: Variant["name"];
    displayOrder: Variant["displayOrder"];
    createdAt: Variant["createdAt"];
    options: VariantOption["value"][];
    skus: Array<{
      id: SKU["id"];
      quantity: SKU["quantity"];
      createdAt: SKU["createdAt"];
      hierarchy: Array<{
        option_id: VariantOption["id"];
        option_name: VariantOption["value"];
      }>;
    }>;
  }>;
};

export type VariantWithDetails = {
  variant_id: Variant["id"];
  shop_id: Variant["shop_id"];
  product_id: Variant["product_id"];
  variant_name: Variant["name"];
  variant_displayOrder: Variant["displayOrder"];
  variant_createdAt: Variant["createdAt"];
  options: VariantOption["value"][];
  skus: Array<{
    id: SKU["id"];
    quantity: SKU["quantity"];
    createdAt: SKU["createdAt"];
    hierarchy: Array<{
      option_id: VariantOption["id"];
      option_name: VariantOption["value"];
    }>;
  }>;
};

export type NewVariantInput = {
  name: string;
  options: string[];
};

export type ProductRow = {
  _id: string;
  title: string;
  price: number;
  imageUrl?: string;
};
