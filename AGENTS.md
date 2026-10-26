# Project Guidelines

## Technology Versions

Frontend versions are declared in `books-blooms-frontend/package.json`; resolved versions come from `books-blooms-frontend/package-lock.json`.

| Technology | Declared version | Resolved version |
| --- | --- | --- |
| React | `^19.2.8` | `19.3.0` |
| React DOM | `^19.2.8` | `19.3.0` |
| React Router DOM | `^7.18.4` | `7.18.4` |
| Vite | `^8.3.0` | `8.3.4` |
| Tailwind CSS | `^4.3.3` | `4.3.3` |

Backend versions below are observed in the repository's local Python environment. There is no committed Python dependency manifest, so these are not guaranteed pins for other environments.

| Technology | Observed version |
| --- | --- |
| Python | `3.13.13` |
| Django | `6.1.2` |
| Django REST Framework | `3.18.3` |
| django-cors-headers | `4.9.0` |
| Pillow | `13.0.0` |

When changing dependencies, verify the committed frontend manifest and lockfile, and update this table. If a Python dependency manifest is added, use it as the authoritative source for backend versions and keep this summary in sync.


MUST DO - DO NOT MAKE ANY CODE CHANGE. ONLY markdown updates / creation are allowed. This should be treated as read only repo for all code related updates. Always work in plan / documentation update mode 