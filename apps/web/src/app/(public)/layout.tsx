import Footer from "@/components/features/landing/footer";
import Navbar from "@/components/features/landing/navbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main>
    <Navbar />
    {children}
    <Footer />
    </main>
  );
}
