import { FunctionReturnType } from "convex/server";

import { api } from "../_generated/api";
import { Doc, Id } from "../_generated/dataModel";

export type TypeProduct = NonNullable<FunctionReturnType<typeof api.products.getProductById>>
export type TypeVariant = Doc<'variants'> & { options: Doc<'variantOptions'>[] }
export type TypeSKU = Omit<Doc<'skus'>, 'options'> & { options: Doc<'variantOptions'>[] }
export type TypeImage = Doc<'images'>

export type TypeStore = Doc<'stores'>
export type TypeUser = FunctionReturnType<typeof api.users.getUserData>;
