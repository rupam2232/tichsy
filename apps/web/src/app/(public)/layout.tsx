import Footer from "@/components/landing/footer";
import Navbar from "@/components/landing/navbar";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className=" overflow-x-clip">
      <Navbar />
      {children}
      <Footer />
    </main>
  );
}
