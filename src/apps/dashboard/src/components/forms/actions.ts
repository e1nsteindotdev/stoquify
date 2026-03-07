import { Id } from "api/data-model";
import { TypeDecodedImage, TypeDecodedVariant } from "./types";

export const getImageChanges = (
  oldImages: TypeDecodedImage[],
  newImages: TypeDecodedImage[],
) => {
  const toDelete: TypeDecodedImage[] = [];
  const toUpdate: TypeDecodedImage[] = [];
  const toCreate: TypeDecodedImage[] = [];

  const oldMap = new Map(oldImages.map((img) => [img.tempId, img]));
  const newMap = new Map(newImages.map((img) => [img.tempId, img]));

  for (const oldImg of oldImages) {
    if (!newMap.has(oldImg.tempId)) {
      toDelete.push(oldImg);
    } else {
      const newImg = newMap.get(oldImg.tempId)!;
      if (
        oldImg.url !== newImg.url ||
        oldImg.order !== newImg.order ||
        oldImg.hidden !== newImg.hidden
      ) {
        toUpdate.push(newImg);
      }
    }
  }

  for (const newImg of newImages) {
    if (!oldMap.has(newImg.tempId)) {
      toCreate.push(newImg);
    }
  }

  return { toDelete, toUpdate, toCreate };
};

const compareOptions = (
  options1: { tempId: string; order: number | undefined; name: string }[],
  options2: { tempId: string; order: number | undefined; name: string }[],
) => {
  if (options1.length !== options2.length) return false;
  const oldOptMap = new Map(options1.map((o) => [o.tempId, o]));
  const newOptMap = new Map(options2.map((o) => [o.tempId, o]));
  for (const oldOpt of options1) {
    const newOpt = newOptMap.get(oldOpt.tempId);
    if (!newOpt) return false;
    if (oldOpt.order !== newOpt.order || oldOpt.name !== newOpt.name) {
      return false;
    }
  }
  return true;
};

export const getVariantChanges = (
  oldVariants: TypeDecodedVariant[],
  newVariants: TypeDecodedVariant[],
): {
  toDelete: TypeDecodedVariant[];
  toUpdate: TypeDecodedVariant[];
  toCreate: TypeDecodedVariant[];
} | null => {
  const toDelete: TypeDecodedVariant[] = [];
  const toUpdate: TypeDecodedVariant[] = [];
  const toCreate: TypeDecodedVariant[] = [];

  const oldMap = new Map(oldVariants.map((v) => [v.tempId, v]));
  const newMap = new Map(newVariants.map((v) => [v.tempId, v]));

  for (const oldVariant of oldVariants) {
    if (!newMap.has(oldVariant.tempId)) {
      toDelete.push(oldVariant);
    } else {
      const newVariant = newMap.get(oldVariant.tempId)!;
      if (
        oldVariant.name !== newVariant.name ||
        oldVariant.order !== newVariant.order ||
        !compareOptions(oldVariant.options, newVariant.options)
      ) {
        toUpdate.push(newVariant);
      }
    }
  }

  for (const newVariant of newVariants) {
    if (!oldMap.has(newVariant.tempId)) {
      toCreate.push(newVariant);
    }
  }

  if (toDelete.length === 0 && toUpdate.length === 0 && toCreate.length === 0) {
    return null;
  }

  return { toDelete, toUpdate, toCreate };
};

type ProductFormValues = {
  categoryId: Id<"categories"> | undefined;
  title: string;
  desc: string;
  cost: number;
  price: number;
  discount: number;
  oldPrice: number;
  stockingStrategy: "by_demand" | "by_variants" | "by_number" | undefined;
  status: "active" | "hidden" | "incomplete" | undefined;
};

type ProductFromDb = {
  categoryId?: Id<"categories">;
  title?: string;
  desc?: string;
  price?: number;
  cost?: number;
  discount?: number;
  oldPrice?: number;
  stockingStrategy?: "by_demand" | "by_variants" | "by_number" | undefined;
  status: "active" | "hidden" | "incomplete" | undefined;
};

export const getProductChanges = (
  oldProduct: ProductFromDb | undefined,
  newProduct: ProductFormValues,
): Partial<ProductFormValues> | null => {
  if (!oldProduct) return null;

  const changes: Partial<ProductFormValues> = {};

  if (oldProduct.title !== newProduct.title) {
    changes.title = newProduct.title;
  }
  if (oldProduct.desc !== newProduct.desc) {
    changes.desc = newProduct.desc;
  }
  if (oldProduct.categoryId !== newProduct.categoryId) {
    changes.categoryId = newProduct.categoryId;
  }
  if (oldProduct.price !== newProduct.price) {
    changes.price = newProduct.price ?? 0;
  }
  if (oldProduct.cost !== newProduct.cost) {
    changes.cost = newProduct.cost;
  }
  if (oldProduct.discount !== newProduct.discount) {
    changes.discount = newProduct.discount;
  }
  if (oldProduct.oldPrice !== newProduct.oldPrice) {
    changes.oldPrice = newProduct.oldPrice ?? 0;
  }
  if (oldProduct.status !== newProduct.status) {
    changes.status = newProduct.status;
  }
  if (oldProduct.stockingStrategy !== newProduct.stockingStrategy) {
    changes.stockingStrategy = newProduct.stockingStrategy;
  }

  return Object.keys(changes).length > 0 ? changes : null;
};
