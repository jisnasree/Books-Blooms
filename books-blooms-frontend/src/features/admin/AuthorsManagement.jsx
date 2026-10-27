import { useEffect, useState } from "react";
import { CATALOG_AUTHORS_URL } from "../../constants";

function AuthorsManagement() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [authorName, setAuthorName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");

  const [editingAuthorId, setEditingAuthorId] = useState(null);
  const [editedAuthorName, setEditedAuthorName] = useState("");

  useEffect(() => {
    async function fetchAuthors() {
      try {
        const token = sessionStorage.getItem("authToken");

        const response = await fetch(
          CATALOG_AUTHORS_URL,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch authors.");
        }

        const data = await response.json();
        setAuthors(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAuthors();
  }, []);

  if (loading) {
    return <p className="p-6">Loading authors...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600">{error}</p>;
  }


  async function handleAddAuthor(e) {
    e.preventDefault();
    setFormError("");

    const name = authorName.trim();

    if (!name) {
      setFormError("Author name is required.");
      return;
    }

    try {
      const token = sessionStorage.getItem("authToken");

      const response = await fetch(
        CATALOG_AUTHORS_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ name }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.name?.[0] || "Failed to create author."
        );
      }

      const newAuthor = await response.json();

      setAuthors((previousAuthors) =>
        [...previousAuthors, newAuthor].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setAuthorName("");
      setShowForm(false);
    } catch (error) {
      setFormError(error.message);
    }
  }


  async function handleEditAuthor(e) {
    e.preventDefault();
    setFormError("");

    const name = editedAuthorName.trim();

    if (!name) {
      setFormError("Author name is required.");
      return;
    }

    try {
      const token = sessionStorage.getItem("authToken");

      const response = await fetch(
        `${CATALOG_AUTHORS_URL}${editingAuthorId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({ name }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.name?.[0] || "Failed to update author."
        );
      }

      const updatedAuthor = await response.json();

      setAuthors((previousAuthors) =>
        previousAuthors
          .map((author) =>
            author.id === updatedAuthor.id
              ? updatedAuthor
              : author
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      setEditingAuthorId(null);
      setEditedAuthorName("");
    } catch (error) {
      setFormError(error.message);
    }
  }


  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">
        Authors
      </h1>

      <div className="mb-6">
        <button
          onClick={() => setShowForm(!showForm)}
          
        >
          {showForm ? <span className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100">Cancel</span> :  <span className="mb-4 rounded bg-green-700 px-4 py-2 text-white">Add Author</span>}
        </button>

        {showForm && (
          <form onSubmit={handleAddAuthor} className="mt-4 max-w-md space-y-3">
            <label className="block text-sm font-medium">
              Author Name
            </label>

            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Enter author name"
              className="w-full rounded-lg border border-gray-300 p-2"
              required
            />

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}

            <button
              type="submit"
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-rose-700"
            >
              Save Author
            </button>
          </form>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-500 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#203746] text-white">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Author Name</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {authors.map((author) => (

              <tr key={author.id} className="border-t">
                <td className="px-4 py-3">{author.id}</td>

                <td className="px-4 py-3">
                  {editingAuthorId === author.id ? (
                    <form
                      onSubmit={handleEditAuthor}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        type="text"
                        value={editedAuthorName}
                        onChange={(e) => setEditedAuthorName(e.target.value)}
                        className="rounded-lg border border-gray-300 p-2"
                        required
                      />

                      <button
                        type="submit"
                        className="rounded-lg bg-green-600 px-3 py-2 text-white"
                      >
                        Save
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingAuthorId(null);
                          setEditedAuthorName("");
                          setFormError("");
                        }}
                        className="rounded-lg border px-3 py-2"
                      >
                        Cancel
                      </button>
                    </form>
                  ) : (
                    author.name
                  )}
                </td>

                <td className="px-4 py-3">
                  {editingAuthorId !== author.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAuthorId(author.id);
                        setEditedAuthorName(author.name);
                        setFormError("");
                      }}
                      className="font-medium text-green-600 hover:text-rose-800"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>

            ))}

            {authors.length === 0 && (
              <tr>
                <td colSpan="2" className="px-4 py-6 text-center text-gray-500">
                  No authors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default AuthorsManagement;