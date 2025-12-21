import { useQuery } from "convex/react";
import { api } from "api/convex";
import { RightChevron } from "./icons/right-chevron";
import { DownChevron } from "./icons/down-chevron";
import type { Doc } from "api/data-model";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

export function OurCategories() {
  const categories = useQuery(api.categories.listCategories);
  const products = useQuery(api.products.listProducts);

  return (
    <div id="categories" className="flex flex-col pt-6">
      <div className="relative mx-auto">
        <p className="uppercase text-primary text-[41px] lg:text-[103px] font-display tracking-tighter mx-auto">
          NOS CATÉGORIES
        </p>
        <p className="absolute font-display -left-6 lg:-left-14 lg:bottom-[22px] bottom-[10px] text-[19px] lg:text-[47px] text-black/20 font-bold tracking-[-0.06em]">
          01
        </p>
      </div>
      <div className={`grid lg:grid-cols-2 border-t-1 border-white`}>
        {categories?.map((c, i) => (
          <Category
            categoriesLength={categories.length}
            index={i}
            category={c}
            products={products?.filter((p) => p.categoryId === c._id)}
          />
        ))}
      </div>
    </div>
  );
}

function Category({
  category,
  products,
  index,
  categoriesLength,
}: {
  categoriesLength: number;
  index: number;
  products: Doc<"products">[] | undefined | null;
  category: Doc<"categories">;
}) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const selectedProduct = products ? products[selected] : null;
  const productsLength = products?.length;

  const visibleImages =
    selectedProduct?.images
      ?.filter((img) => !img.hidden && img.url)
      .sort((a, b) => a.order - b.order) || [];

  function up() {
    setSelected((prev) => {
      if (productsLength && prev >= productsLength - 1) return 0;
      else return prev + 1;
    });
  }
  function down() {
    setSelected((prev) => {
      if (productsLength && prev === 0) return productsLength - 1;
      else return prev - 1;
    });
  }

  useEffect(() => {
    const id = setTimeout(() => {
      up();
    }, 2000);
    return () => {
      clearTimeout(id);
    };
  });

  const [isHovered, setIsHovered] = useState(false);

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedProduct?._id]);

  // Cycle through images on hover
  useEffect(() => {
    if (!isHovered || visibleImages.length <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % visibleImages.length);
    }, 500);

    return () => clearInterval(intervalId);
  }, [isHovered, visibleImages.length]);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCurrentImageIndex(0);
  };

  return (
    <div
      className={`flex flex-col lg:flex-row w-full lg:border-b-1 lg:border-white ${index % 2 === 0 && "justify-end border-r-1"}`}
    >
      <div className="flex justify-center h-[230px] xs:h-auto gap-3 lg:gap-5 xs:px-3 my-5 lg:px-5">
        {/* left side  */}
        <div
          className={`flex flex-col gap-1.5 lg:gap-3 min-w-[135px] lg:min-w-[300px] flex-1 ${index % 2 === 0 ? "order-1 items-end" : "order-2 item-start"}`}
        >
          <button
            onClick={() => navigate({ to: `/categories/${category._id}` })}
            className="flex  flex-col shrink-0 gap-0.5"
          >
            <p
              className={`text-[18px] font-[500] lg:text-[35px] tracking-[0.04em] uppercase cursor-pointer leading-[1.1] ${index % 2 === 0 ? "text-end" : "text-start"}`}
            >
              {category.name}
            </p>
            <p
              className={`text-primary italic text-[12px] lg:text-[16px] font-medium cursor-pointer uppercase font-inter ${index % 2 === 0 ? "text-end" : "text-start"}`}
            >
              {productsLength} produit{productsLength !== 1 ? "s" : ""}
            </p>
          </button>
          <div className="flex flex-1 min-h-0 overflow-hidden flex-col justify-between gap-2 h-full">
            <div
              className={`text-black/20 font-inter font-semibold text-[10px] lg:text-[16px] flex flex-col gap-1 lg:gap-1.5 uppercase h-[160px] lg:h-[300px] overflow-clip
              ${index % 2 === 0 ? "text-end" : "text-start"}`}
            >
              {products?.map(
                (p, i) =>
                  p.categoryId === category._id && (
                    <Link
                      to={`/products/$slug`}
                      search={{
                        source: {
                          sourceType: "categories",
                          sourceName: category.name,
                        },
                      }}
                      params={{ slug: p._id }}
                      key={i}
                      className={`text-black font-medium text-wrap transition-all duration-400 ease-out leading-[1.2] ${selectedProduct?._id === p._id ? "opacity-100" : "opacity-30"}`}
                    >
                      {p.title}
                    </Link>
                  )
              )}
            </div>
          </div>
          <div
            className={`flex shrink-0 flex-col gap-1 lg:gap-3 mt-auto lg:pb-2 ${index % 2 === 0 ? "items-end" : "items-start"}`}
          >
            <button
              onClick={() => down()}
              className="border-[1.5px] border-black py-2 px-1"
            >
              <DownChevron color="black" size={10} className="rotate-180" />
            </button>
            <button
              onClick={() => up()}
              className="border-[1.5px] border-black py-2 px-1"
            >
              <DownChevron color="black" size={10} />
            </button>
          </div>
        </div>

        {/* right side */}
        <Link
          to={`/categories/$slug`}
          params={{ slug: category._id }}
          className={`relative min-w-[185px] min-h-[230px] lg:h-[600px] lg:min- flex-2 aspect-[4/5] border-1 border-white ${index % 2 === 0 ? "order-2" : "order-1"}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {products?.map((p) => {
            const productImages =
              p.images
                ?.filter((img) => !img.hidden && img.url)
                .sort((a, b) => a.order - b.order) || [];
            const isSelected = p._id === selectedProduct?._id;
            const imageToShow =
              isSelected && productImages.length > 0
                ? productImages[currentImageIndex % productImages.length]?.url
                : productImages[0]?.url;

            return (
              <img
                key={p._id}
                className={`bg-[#F1F1F1] h-full w-full object-cover transition-all ease-in-out duration-1000 absolute 
                ${!isSelected ? "opacity-0" : "opacity-100"}`}
                src={imageToShow}
                alt="no image"
              />
            );
          })}
          <div className="absolute w-[97%] bottom-2.25 lg:bottom-3.5 left-1/2 -translate-x-1/2 lg:px-4 px-2  py-1.5 flex justify-between items-center border-black border-1 z-50">
            <p className="text-black uppercase font-inter font-semibold text-[8px] lg:text-[12px]">
              tous les "{category.name}"
            </p>
            <RightChevron size={10} />
          </div>
        </Link>
      </div>
      {index < categoriesLength && (
        <div className="w-full lg:hidden h-[1px] bg-white" />
      )}
      {index % 2 == 0 && (
        <div className="h-full hidden lg:flex w-[1px] bg-white" />
      )}
    </div>
  );
}
