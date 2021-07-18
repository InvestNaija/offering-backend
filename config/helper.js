exports.generateOTCode = (size = 6, alpha = true) => {
    let characters = alpha
      ? "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-"
      : "0123456789";
    characters = characters.split("");
    let selections = "";
    for (let i = 0; i < size; i++) {
      let index = Math.floor(Math.random() * characters.length);
      selections += characters[index];
      characters.splice(index, 1);
    }
    return selections;
  };

exports.generatePassword = (length = 8,
                            containNumbers = true,
                            containSpecialCharacters = true) => {
    let password = "";
    let characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*_-+=";

    if (containNumbers) {
        characters += numbers;
    }

    if (containSpecialCharacters) {
        characters += symbols;
    }

    // generate password
    for (let i = 0; i < length; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return password;
}
