import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "api/convex";
import { Header, HeaderAnonc, Navbar } from "@/components/navbar";
import { OurCategories } from "@/components/our-categories";
import { Bande } from "@/components/ui/bande";
import { CTA } from "@/components/cta";
import { Steps } from "@/components/steps";
import { Livraison } from "@/components/livraison";
import { FAQs } from "@/components/faq";
import { OurCollections } from "@/components/our-collections";
import { Footer } from "@/components/footer";
import { DashedSeperator } from "@/components/ui/dashed-seperator";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const products = useQuery(api.products.listProducts);
  console.log(products);
  return (
    <div className="overflow-clip">
      <div className="px-3 lg:px-4 max-w-[1800px] mx-auto bg-[#E6E6E6]">
        <HeaderAnonc />
        <div className="flex flex-col gap-10 lg:gap-30 w-full border-l-1 border-r-1 border-seperator relative">
          <div>
            <Navbar />
            <Header />
            <Bande>DÉCOUVREZ LES NOUVEAUTÉS</Bande>
            <OurCategories />
          </div>
          <div>
            <CTA />
            <Livraison />
          </div>
          <OurCollections />
          <Steps />
          <FAQs />
          <Footer />
        </div>
      </div>
    </div>
  );
}
