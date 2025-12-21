import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "api/convex";
import { Link, useNavigate } from "@tanstack/react-router";
import { IconArrowLeft, IconMinus, IconPlus, IconShoppingCart, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  selection: {
    variantId: string;
    variantOptionId: string;
    variantName: string;
    optionName: string;
  }[];
}

export default function POSPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showVariantModal, setShowVariantModal] = useState(false);

  const categories = useQuery(api.categories.listCategories);
  const products = useQuery(api.products.listProducts);
  const createSale = useMutation(api.sales.createSale);

  const filteredProducts = selectedCategory 
    ? products?.filter(p => p.categoryId === selectedCategory)
    : products;

  const addToCart = (product: any, selection: any[] = []) => {
    const existingIndex = cart.findIndex(item => 
      item.productId === product._id && 
      JSON.stringify(item.selection) === JSON.stringify(selection)
    );

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        productId: product._id,
        title: product.title || "Produit sans titre",
        price: product.price || 0,
        quantity: 1,
        selection
      }]);
    }
    setShowProductSelector(false);
    setSelectedProduct(null);
    setShowVariantModal(false);
  };

  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const handleConfirm = async () => {
    if (cart.length === 0) return;

    try {
      const subTotalCost = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      await createSale({
        order: cart.map(item => ({
          productId: item.productId as any,
          price: item.price,
          quantity: item.quantity,
          selection: item.selection.map(s => ({
            variantId: s.variantId as any,
            variantOptionId: s.variantOptionId as any
          }))
        })),
        subTotalCost
      });
      toast.success("Vente confirmée !");
      setCart([]);
    } catch (error) {
      toast.error("Erreur lors de la confirmation de la vente");
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between px-6 bg-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
            <IconArrowLeft className="size-6" />
          </Button>
          <h1 className="text-xl font-bold">Point de Vente (POS)</h1>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => navigate({ to: "/" })}>Quitter</Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Cart Side */}
        <div className="w-full md:w-1/3 border-r flex flex-col bg-muted/30">
          <div className="p-4 border-b bg-card flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <IconShoppingCart className="size-5" /> Panier
            </h2>
            <span className="text-sm text-muted-foreground">{cart.length} articles</span>
          </div>
          
          <div className="flex-1 p-4 overflow-auto">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50 mt-20">
                <IconShoppingCart className="size-12 mb-2" />
                <p>Votre panier est vide</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        {item.selection.map((s, i) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {s.variantName}: {s.optionName}
                          </p>
                        ))}
                      </div>
                      <p className="font-bold">{item.price} DA</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 border rounded-md px-2 py-1 bg-background">
                        <Button variant="ghost" size="icon" className="size-6" onClick={() => updateQuantity(index, -1)}>
                          <IconMinus className="size-3" />
                        </Button>
                        <span className="min-w-[20px] text-center font-medium">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="size-6" onClick={() => updateQuantity(index, 1)}>
                          <IconPlus className="size-3" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold">{(item.price * item.quantity).toFixed(2)} DA</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            </div>

          <div className="p-6 border-t bg-card space-y-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)} DA</span>
            </div>
            
            <Button className="w-full py-6 text-lg" variant="secondary" onClick={() => setShowProductSelector(true)}>
              <IconPlus className="mr-2" /> Ajouter un produit
            </Button>
            
            <Button className="w-full py-6 text-lg" disabled={cart.length === 0} onClick={handleConfirm}>
              Confirmer la vente
            </Button>
          </div>
        </div>

        {/* Content Side */}
        <div className={`
          flex-1 flex flex-col bg-background z-10
          ${showProductSelector 
            ? "fixed inset-0 pt-16 md:relative md:pt-0" 
            : "hidden md:flex md:relative"}
        `}>
          {!showProductSelector ? (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center text-muted-foreground opacity-50">
               <IconShoppingCart className="size-24 mb-4" />
               <p className="text-xl">Cliquez sur "Ajouter un produit" pour commencer</p>
            </div>
          ) : (
            <div className="h-full flex flex-col transition-all p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {!selectedCategory ? "Choisir une catégorie" : categories?.find(c => c._id === selectedCategory)?.name}
                </h2>
                <Button variant="ghost" onClick={() => {
                   if (selectedCategory) setSelectedCategory(null);
                   else setShowProductSelector(false);
                }}>
                  {selectedCategory ? <IconArrowLeft className="mr-2" /> : <IconX />}
                  {selectedCategory ? "Retour aux catégories" : ""}
                </Button>
              </div>

              {!selectedCategory ? (
                /* Categories Grid */
                <div className="flex-1 overflow-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categories?.map(cat => (
                      <Card 
                        key={cat._id}
                        className="p-6 flex items-center justify-center cursor-pointer hover:bg-accent transition-colors text-center font-bold text-lg h-32"
                        onClick={() => setSelectedCategory(cat._id)}
                      >
                        {cat.name}
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                /* Products Grid */
                <div className="flex-1 overflow-auto">
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts?.map(product => (
                      <Card 
                        key={product._id} 
                        className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowVariantModal(true);
                        }}
                      >
                        <div className="aspect-square bg-muted relative">
                          {product.images?.[0]?.url ? (
                            <img src={product.images[0].url} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              Aucune image
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold truncate">{product.title}</h3>
                          <p className="text-primary font-bold mt-1 text-lg">{product.price} DA</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Variant Modal */}
      <VariantSelectionModal 
        product={selectedProduct} 
        open={showVariantModal} 
        onClose={() => {
          setShowVariantModal(false);
          setSelectedProduct(null);
        }}
        onConfirm={(selection) => addToCart(selectedProduct, selection)}
      />
    </div>
  );
}

function VariantSelectionModal({ product, open, onClose, onConfirm }: any) {
  const productWithVariants = useQuery(api.products.getProductById, product?._id ? { id: product._id } : "skip");
  const [selections, setSelections] = useState<any[]>([]);

  if (!product) return null;

  const handleSelect = (variant: any, option: any) => {
    const newSelections = [...selections];
    const index = newSelections.findIndex(s => s.variantId === variant._id);
    if (index > -1) {
      newSelections[index] = {
        variantId: variant._id,
        variantOptionId: option._id,
        variantName: variant.name,
        optionName: option.name
      };
    } else {
      newSelections.push({
        variantId: variant._id,
        variantOptionId: option._id,
        variantName: variant.name,
        optionName: option.name
      });
    }
    setSelections(newSelections);
  };

  const isComplete = productWithVariants?.variants?.every((v: any) => 
    selections.find(s => s.variantId === v._id)
  ) ?? true;

  if (productWithVariants && (!productWithVariants.variants || productWithVariants.variants.length === 0)) {
    // If no variants, just confirm directly
    setTimeout(() => {
        onConfirm([]);
    }, 0);
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product.title} - Options</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {productWithVariants?.variants?.map((variant: any) => (
            <div key={variant._id} className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{variant.name}</h4>
              <div className="flex flex-wrap gap-2">
                {variant.options?.map((option: any) => {
                  const isSelected = selections.find(s => s.variantOptionId === option._id);
                  return (
                    <Button 
                      key={option._id}
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => handleSelect(variant, option)}
                    >
                      {option.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button disabled={!isComplete} onClick={() => onConfirm(selections)}>Ajouter au panier</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
