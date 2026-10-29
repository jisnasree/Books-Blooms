import { Link } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

function Account() {
  const accountSections = [
    {
      title: "My Profile",
      description: "View and update your personal information.",
      icon: "👤",
      path: "/profile",
    },
    {
      title: "My Orders",
      description: "View your orders and track your purchases.",
      icon: "📚",
      path: "/orders",
    },
    {
      title: "Saved Addresses",
      description: "Manage your delivery addresses.",
      icon: "📍",
      path: "/addresses",
    },
  ];

  return (
    <>
      <Header />

      <main className="min-h-screen bg-[#FBFAF7] px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-rose-700">
              Books & Blooms
            </p>

            <h1 className="text-3xl font-bold text-gray-800">
              My Account
            </h1>

            <p className="mt-3 text-gray-600">
              Manage your profile, orders, and delivery addresses.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {accountSections.map((section) => (
              <Link
                key={section.title}
                to={section.path}
                className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-2xl">
                  {section.icon}
                </div>

                <h2 className="text-lg font-semibold text-gray-800">
                  {section.title}
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  {section.description}
                </p>

                <span className="mt-5 inline-block text-sm font-semibold text-rose-700">
                  View details →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default Account;