// app/page.tsx
import { FooterModern } from "@/components/footer-modern";
import { HeroSection } from "@/components/hero-section-modern";
import { PillNav } from "@/components/layout/pill-nav";
import { NavigationHeader } from "@/components/layout/templates/nav";
import { ProductList } from "@/components/product-list";

export default function Home() {
  return (
    <>
        <NavigationHeader /> 
      <HeroSection />
      <ProductList />
      <FooterModern/>
    </>
  );
}