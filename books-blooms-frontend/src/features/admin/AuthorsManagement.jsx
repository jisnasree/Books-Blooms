import { useEffect, useState } from "react";
import { CATALOG_AUTHORS_URL } from "../../constants";

function AuthorsManagement() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [editingAuthorId, setEditingAuthorId] = useState(null);
  const [editedAuthorName, setEditedAuthorName] = useState("");
  const [deletingAuthorId, setDeletingAuthorId] = useState(null);

  useEffect(() => {
    async function fetchAuthors() {
      try {
        const response = await fetch(CATALOG_AUTHORS_URL, {
          headers: {
            Authorization: `Token ${sessionStorage.getItem("authToken")}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch authors.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("The authors response was not a list.");
        }

        setAuthors(data);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAuthors();
  }, []);

  async function handleAddAuthor(event) {
    event.preventDefault();
    setFormError("");

    const name = authorName.trim();

    if (!name) {
      setFormError("Author name is required.");
      return;
    }

    try {
      const response = await fetch(CATALOG_AUTHORS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${sessionStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.name?.[0] || "Failed to create author.");
      }

      const newAuthor = await response.json();

      setAuthors((previousAuthors) =>
        [...previousAuthors, newAuthor].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );
      setAuthorName("");
      setShowForm(false);
    } catch (requestError) {
      setFormError(requestError.message);
    }
  }

  async function handleEditAuthor(event) {
    event.preventDefault();
    setFormError("");

    const name = editedAuthorName.trim();

    if (!name) {
      setFormError("Author name is required.");
      return;
    }

    try {
      const response = await fetch(
        `${CATALOG_AUTHORS_URL}${editingAuthorId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${sessionStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({ name }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.name?.[0] || "Failed to update author.");
      }

      const updatedAuthor = await response.json();

      setAuthors((previousAuthors) =>
        previousAuthors
          .map((author) =>
            author.id === updatedAuthor.id ? updatedAuthor : author
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingAuthorId(null);
      setEditedAuthorName("");
    } catch (requestError) {
      setFormError(requestError.message);
    }
  }

  async function handleDeleteAuthor(author) {
    if (!window.confirm(`Delete author "${author.name}"?`)) {
      return;
    }

    setActionError("");
    setDeletingAuthorId(author.id);

    try {
      const response = await fetch(`${CATALOG_AUTHORS_URL}${author.id}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${sessionStorage.getItem("authToken")}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete author (HTTP ${response.status}).`);
      }

      setAuthors((previousAuthors) =>
        previousAuthors.filter((item) => item.id !== author.id)
      );
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setDeletingAuthorId(null);
    }
  }

  if (loading) {
    return <p className="p-6">Loading authors...</p>;
  }

  if (error) {
    return (
      <p className="p-6 text-red-600" role="alert">
        {error}
      </p>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">Authors</h1>

      {showForm ? (
        <button
          type="button"
          onClick={() => {
            setShowForm(false);
            setAuthorName("");
            setFormError("");
          }}
          className="mb-4 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setFormError("");
          }}
          className="mb-4 rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800"
        >
          Add Author
        </button>
      )}

      {showForm && (
        <form
          onSubmit={handleAddAuthor}
          className="mb-6 flex max-w-lg flex-wrap items-start gap-3"
        >
          <input
            type="text"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
            placeholder="Enter author name"
            aria-label="Author name"
            required
            className="rounded-lg border border-gray-300 px-3 py-2"
          />

          <button
            type="submit"
            className="rounded-lg bg-green-700 px-5 py-2 text-white hover:bg-green-800"
          >
            Save Author
          </button>

          {formError && (
            <p className="w-full text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}
        </form>
      )}

      {actionError && (
        <p className="mb-3 text-sm text-red-600" role="alert">
          {actionError}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white">
       <table className="w-full border-collapse border border-gray-200 bg-white text-sm">
          <thead className="bg-[#203746] text-white border">
            <tr>
              <th scope="col" className="px-4 py-3 border">ID</th>
              <th scope="col" className="px-4 py-3 border">Author Name</th>
              <th scope="col" className="px-4 py-3 border">Actions</th>
            </tr>
          </thead>

          <tbody>
            {authors.map((author) => (
              <tr key={author.id} className="border-t">
                <td className="px-4 py-3 border">{author.id}</td>

                <td className="px-4 py-3 border">
                  {editingAuthorId === author.id ? (
                    <form
                      onSubmit={handleEditAuthor}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input
                        type="text"
                        value={editedAuthorName}
                        onChange={(event) =>
                          setEditedAuthorName(event.target.value)
                        }
                        aria-label="Edit author name"
                        className="rounded-lg border border-gray-300 px-3 py-2"
                        required
                      />

                      <button
                        type="submit"
                        className="rounded-lg bg-green-700 px-3 py-2 text-white hover:bg-green-800"
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
                        className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        Cancel
                      </button>

                      {formError && (
                        <p className="w-full text-sm text-red-600" role="alert">
                          {formError}
                        </p>
                      )}
                    </form>
                  ) : (
                    author.name
                  )}
                </td>

                <td className="px-4 py-3 border">
                  {editingAuthorId !== author.id && (
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAuthorId(author.id);
                          setEditedAuthorName(author.name);
                          setFormError("");
                          setActionError("");
                        }}
                        className="font-medium text-green-700 hover:text-green-900"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAuthor(author)}
                        disabled={deletingAuthorId === author.id}
                        className="font-medium text-red-700 hover:text-rose-900 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingAuthorId === author.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {authors.length === 0 && (
              <tr>
                <td colSpan="3" className="px-4 py-6 text-center text-gray-500" border>
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