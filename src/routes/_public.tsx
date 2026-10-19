import Footer from "@/components/footer";
import Header from "@/components/header/header";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-12 pb-20 md:px-6 md:pt-16">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
