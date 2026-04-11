import Footer from "@/components/footer";
import Header from "@/components/header/header";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <>
      <div
        className="bg-primary pointer-events-none fixed -top-48 -right-48 size-96 opacity-15 blur-3xl select-none"
        aria-hidden="true"
      />
      <Header />
      <main className="mx-auto min-h-screen w-full max-w-6xl flex-1 space-y-10 px-4 pt-10 pb-6 md:px-10">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
