
import heroImage from "../../assets/hero2.png";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import BookList from "./BookList";

function Home() {
  return (
    <section className="min-h-screen flex flex-col bg-[#FBFAF7]">
        <Header />
         
            <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">

                {/* Left side: Hero text */}
                <div className="space-y-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rose-800">
                    Your Next Chapter Starts Here
                </p>

                <h1 className="text-4xl font-bold leading-tight text-[#45332F] md:text-5xl lg:text-6xl">
                    Discover Your Next Great Story
                </h1>

                <p className="max-w-lg text-lg leading-8 text-[#75635C]">
                    Explore New Worlds, Meet Unforgettable Characters, and Find Books That Stay With You Long After the Last Page.
                </p>

                <button
                    type="button"
                    className="rounded-lg bg-green-800 px-7 py-3 font-semibold text-white transition hover:bg-rose-900"
                >
                    Explore Books →
                </button>
                </div>

                {/* Right side: Hero image */}
                <div className="flex justify-center md:justify-end">
                <img
                    src={heroImage}
                    alt="A beautiful collection of books"
                    className="h-auto max-h-[480px] w-full rounded-2xl object-cover shadow-lg"
                />
                </div>

            </div>
        <BookList />
        <Footer />
    </section>
  );
}

export default Home;
