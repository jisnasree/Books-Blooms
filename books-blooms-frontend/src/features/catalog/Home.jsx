import heroImage from "../../assets/hero3.png";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import BookBestSellers from "./BookBestSellers";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <section className="flex min-h-screen flex-col bg-slate-100">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-5 py-2 sm:px-8">
        <div className="grid items-center gap-10 overflow-hidden rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-10 md:grid-cols-2 md:gap-12 md:p-14">
          <div className="space-y-6">
            <p className="inline-flex rounded-full bg-orange-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-700">
              Your next chapter starts here
            </p>

            <h1 className="max-w-xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Find a story worth keeping.
            </h1>

            <p className="max-w-lg text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Discover books to get lost in, share, and return to. Your next
              favorite read is waiting.
            </p>

            <button
              type="button"
              onClick={() => navigate("/books")}
              className="inline-flex items-center rounded-xl bg-orange-600 px-6 py-3.5 font-semibold text-white transition hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
              Explore books
              <span aria-hidden="true" className="ml-2">
                →
              </span>
            </button>

            <p className="text-sm text-slate-500">
              Find your next favorite among our latest reads.
            </p>
          </div>

          <div className="relative">
            <img
              src={heroImage}
              alt="A collection of books"
              className="relative h-auto w-full rounded-2xl object-contain shadow-md"
            />

          </div>
        </div>
      </main>

      <BookBestSellers />
      <Footer />
    </section>
  );
}

export default Home;