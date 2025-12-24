import { Link } from "@tanstack/react-router";
import { Image } from "./ui/image";
import { useQuery } from "convex/react";
import { api } from "@repo/backend/_generated/api";
import { MenuIcon } from "./icons/menu-icon";
import { OrderIcon } from "./icons/order-icon";
import { Cart } from "./cart";

export function Navbar() {
  const categories = useQuery(api.categories.listCategories);
  return (
    <div className="flex items-center w-full py-3 lg:py-4 px-ip border-b-1 border-seperator">
      <Link to="/" className="mr-auto h-full">
        <Image src="/logo.svg" className="h-full" />
      </Link>
      <div className="hidden lg:flex mx-auto gap-6">
        {categories?.map((c, i) => (
          <Link
            key={i}
            to={`/categories/$slug`}
            params={{ slug: c._id as string }}
            className="text-[16px] font-bold font-inter uppercase tracking-[0.1em]"
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="hidden lg:flex  gap-[32px] ml-auto z-50">
        {/* <button><HeartIcon /></button> */}
        <Cart />
      </div>

      <div className="flex lg:hidden gap-4 items-start">
        <Cart />
        <div className="mt-1">
          {" "}
          <MenuIcon />{" "}
        </div>
      </div>
    </div>
  );
}

export function HeaderAnonc() {
  return (
    <div className="py-2 bg-primary flex gap-[32px] overflow-clip px-4">
      {Array.from({ length: 10 }, (_, i) => i).map((_, i) => (
        <div key={i} className="flex gap-1.5 lg:gap-2 items-center">
          <OrderIcon className="scale-[0.8] lg:scale-100" />
          <p className="font-inter font-medium text-white text-[9px] lg:text-[12px] uppercase text-nowrap">
            LIVRAISON GRATUITE à partir de 8000DA d'achats
          </p>
        </div>
      ))}
    </div>
  );
}

export function Header() {
  const settings = useQuery(api.settings.getSettings);
  const products = useQuery(api.products.listProducts);
  const productsCount = products?.length ?? 0;
  const locationLink = settings?.locationLink || "";

  return (
    <div className="w-full flex flex-col gap-1 justify-center items-start py-3 lg:py-5 px-2 lg:px-4">
      <div className="flex gap-2.5 text-[12px] lg:text-[25px] uppercase mx-auto">
        <span>[</span>
        <span>{productsCount}</span>
        <span>produits</span>
        <span> disponibles</span>
        <span>]</span>
      </div>
      {/* 139 */}
      <p className="font-extrabold font-display text-[52px] lg:text-[clamp(67px,calc(67px+0.0796*(100vw-1100px)),120px)] leading-[0.9] tracking-tight text-primary text-start uppercase lg:text-nowrap">
        Bienvenue dans notre boutique
      </p>
      <div className="flex justify-between w-full text-[14px] lg:text-[31px] uppercase">
        <div className="flex gap-10 font-medium">
          <p>Situé</p>
          <p className="text-black/20">
            AU CŒUR DE <span className="text-black font-bold">L’ALGÉRIE</span>
          </p>
        </div>
        {locationLink ? (
          <a
            href={
              locationLink.startsWith("http")
                ? locationLink
                : `https://${locationLink}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline cursor-pointer"
          >
            /localisation
          </a>
        ) : (
          <p>/localistion</p>
        )}
      </div>
    </div>
  );
}
