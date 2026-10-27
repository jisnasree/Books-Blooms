
import { useEffect, useState, useContext } from "react";
import { AUTH_PROFILE_URL } from "../../constants";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { UserContext } from "../../context/UserContext";

function Profile() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const { user, setUser, loading } = useContext(UserContext);
  //populate form fields when the shared profile data loads
  useEffect(() => {
    if (!loading && user.isAuthenticated) {
      setFirstName(user.first_name || "");
      setLastName(user.last_name || "");
      setPhoneNumber(user.phone_number || "");
    }
  }, [loading, user]);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setSaving(true);

    try {
      const token = sessionStorage.getItem("authToken");

      if (!token) {
        throw new Error("Please log in to update your profile.");
      }

      const formData = new FormData();
      formData.append("first_name", firstName);
      formData.append("last_name", lastName);
      formData.append("phone_number", phoneNumber);

      if (selectedImage) {
        formData.append("profile_image", selectedImage);
      }

      const response = await fetch(AUTH_PROFILE_URL, {
        method: "PATCH",
        headers: {
          Authorization: `Token ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || "Failed to update profile."
        );
      }

      const updatedProfile = await response.json();

      setUser((previousUser) => ({
        ...previousUser,
        ...updatedProfile,
        isAuthenticated: true,
      }));

      setFirstName(updatedProfile.first_name || "");
      setLastName(updatedProfile.last_name || "");
      setPhoneNumber(updatedProfile.phone_number || "");
      setSelectedImage(null);
      setMessage("Profile updated successfully!");

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }
  if (loading) {
    return <p className="p-6">Loading profile...</p>;
  }

  if (!user.isAuthenticated) {
    return (
      <p className="p-6 text-red-600">
        Please log in to view your profile.
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFAF7] px-4 py-10 sm:px-6">
      <Header />
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold text-gray-800">
          My Account
        </h1>

        <p className="mb-8 text-gray-500">
          View and manage your profile details.
        </p>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">

          {/* Left side: Current profile details */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-xl font-semibold text-gray-800">
              My Profile
            </h2>

            <div className="mb-6 flex flex-col items-center rounded-xl bg-[#FBFAF7] p-6">
              {user.profile_image ? (
                <img
                  src={user.profile_image}
                  alt="Profile"
                  className="mb-4 h-32 w-32 rounded-full border-4 border-white object-cover shadow"
                />
              ) : (
                <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-rose-100 text-4xl font-semibold text-rose-700">
                  {(user.first_name || user.email || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <h3 className="text-xl font-semibold text-gray-800">
                {[user.first_name, user.last_name]
                  .filter(Boolean)
                  .join(" ") || "Your Name"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Customer Profile
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="mt-1 break-words font-medium text-gray-800">
                  {user.email}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">First Name</p>
                <p className="mt-1 font-medium text-gray-800">
                  {user.first_name || "Not provided"}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">Last Name</p>
                <p className="mt-1 font-medium text-gray-800">
                  {user.last_name || "Not provided"}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="mt-1 font-medium text-gray-800">
                  {user.phone_number || "Not provided"}
                </p>
              </div>
            </div>
          </section>

          {/* Right side: Edit profile form */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-gray-800">
              Edit Profile
            </h2>

            <p className="mb-6 text-sm text-gray-500">
              Update your information below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Profile Image
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setSelectedImage(e.target.files[0] || null)
                  }
                  className="block w-full rounded-lg border border-gray-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-rose-50 file:px-3 file:py-2 file:font-medium file:text-rose-700"
                />

                {selectedImage && (
                  <p className="mt-2 text-xs text-gray-500">
                    Selected: {selectedImage.name}
                  </p>
                )}
                {/* {selectedImage && (
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Profile preview"
                    className="mt-3 h-24 w-24 rounded-full object-cover"
                  />
                )} */}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address
                </label>

                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-gray-500"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Email address cannot be changed.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  First Name
                </label>

                <input
                  type="text"
                  value={firstName}
                  onChange={(event) =>
                    setFirstName(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Last Name
                </label>

                <input
                  type="text"
                  value={lastName}
                  onChange={(event) =>
                    setLastName(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) =>
                    setPhoneNumber(event.target.value)
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              {message && (
                <p role="status" className="text-sm text-green-700">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </form>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Profile;
