
export const validatePassword = (password) => {

    if (password.length < 8) {
        return "Password must be at least 8 characters long.";
    }

    if (!/[A-Za-z]/.test(password)) {
        return "Password must contain at least one letter.";
    }

    if (!/\d/.test(password)) {
        return "Password must contain at least one digit.";
    }

    if (!/[^A-Za-z0-9\s]/.test(password)) {
        return "Password must contain at least one special character.";
    }

    return "";
};


export const validateName = (name, fieldName) => {

    const trimmedName = name.trim();

    if (!trimmedName) {
        return `${fieldName} is required.`;
    }

    const namePattern = /^\p{L}+(?:[ '-’]\p{L}+)*$/u;

    if (!namePattern.test(trimmedName)) {
        return `${fieldName} can contain only letters, spaces, hyphens, and apostrophes.`;
    }

    return "";
};
