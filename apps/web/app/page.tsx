// app/page.tsx
import { FooterModern } from "@/components/footer-modern";
import { HeroSection } from "@/components/hero-section-modern";
import { NavigationHeader } from "@/modules/layout/templates/nav/index";
import { ProductList } from "@/components/product-list";
import { getRegion } from "@/lib/actions/regions";

export default async function Home() {
  const region = await getRegion('ph');
console.log(region, 'REEG')
  return (
    <>
        <NavigationHeader/> 
      <HeroSection />
      <ProductList  region={region}/>
      <FooterModern/>
    </>
  );
}