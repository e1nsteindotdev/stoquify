import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Header, HeaderAnonc, Navbar } from "@/components/navbar";
import { OurCategories } from "@/components/our-categories";
import { Bande } from "@/components/ui/bande";
import { CTA } from "@/components/cta";
import { Steps } from "@/components/steps";
import { Livraison } from "@/components/livraison";
import { FAQs } from "@/components/faq";
import { OurCollections } from "@/components/our-collections";
import { Footer } from "@/components/footer";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch(
          "http://localhost:8780/catalog?shopId=random-shop-id",
        );
        if (res.ok) {
          console.log("res ok ", res.ok);
          const data = await res.json();
          console.log("full catalog from livestore:", data);
        } else {
          console.log(await res.body);
          console.log("res is not okay : ", res.ok);
        }
      } catch (e) {
        console.error("Failed to fetch catalog:", e);
      }
    };
    fetchCatalog();
    console.log("finsihed fetching the catalog");
  }, []);

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
