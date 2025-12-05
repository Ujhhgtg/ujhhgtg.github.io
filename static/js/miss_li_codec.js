// --- Global Helper: Get Selected Dictionary ---
// Combines hard-coded checkboxes and dynamic text inputs
function getDictionary() {
  // 1. Collect words from checked default checkboxes
  const checkedDefaults = document.querySelectorAll(
    '#dictionary-selection input[type="checkbox"]:checked'
  );
  const defaultWords = Array.from(checkedDefaults).map((cb) => cb.value);

  // 2. Collect words from dynamic text inputs
  const customInputs = document.querySelectorAll(
    '#custom-dictionary-inputs input[type="text"]'
  );
  const customWords = Array.from(customInputs)
    .map((input) => input.value.trim())
    // Filter out empty or duplicate words to ensure base integrity
    .filter((word) => word !== "" && !defaultWords.includes(word));

  // 3. Combine and return the final unique dictionary
  const dictionary = defaultWords.concat(customWords);
  return dictionary;
}

// --- Dynamic Input Handler ---
function addCustomWordInput() {
  const container = document.getElementById("custom-dictionary-inputs");

  // Create new elements for the custom word entry
  const div = document.createElement("div");
  div.className = "custom-word-item";

  const label = document.createElement("label");
  label.textContent = `Custom Word (Base ${getDictionary().length}):`;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "e.g., pizza";
  input.className = "custom-dict-word";

  // Crucial: Update base display whenever a custom word is typed
  input.addEventListener("input", updateBaseDisplay);

  const removeBtn = document.createElement("button");
  removeBtn.textContent = "X";
  removeBtn.onclick = function () {
    container.removeChild(div);
    updateBaseDisplay(); // Update base after removal
  };

  div.appendChild(label);
  div.appendChild(input);
  div.appendChild(removeBtn);

  // Insert the new input *before* the 'Add Custom Word' button
  container.insertBefore(div, container.lastElementChild);

  // Update the base display immediately after adding the new input
  updateBaseDisplay();
  // Focus the new input for immediate typing
  input.focus();
}

// --- Display Helper ---
function updateBaseDisplay() {
  const dictionary = getDictionary();
  const base = dictionary.length;

  // Update the labels of the custom input boxes to show their digit mapping
  document
    .querySelectorAll(".custom-word-item label")
    .forEach((label, index) => {
      const digit =
        index +
        document.querySelectorAll(
          '#dictionary-selection input[type="checkbox"]:checked'
        ).length;
      label.textContent = `Word for Digit ${digit}:`;
    });

  if (base < 2) {
    document.getElementById("current-base").textContent =
      "ERROR: Base must be >= 2";
    document.getElementById("current-base").style.color = "red";
    return;
  }
  document.getElementById("current-base").style.color = "";
  document.getElementById("current-base").textContent = base;
}

// --- (Keep the rest of the logic from the previous answer below) ---

// --- Base Conversion Helper (Base 10 to Base N) ---
function decimalToBaseN(decimalBytes, base) {
  let baseNString = "";
  const digitsPerByte = Math.ceil(
    (((8 / Math.log2(base)) * Math.log2(base)) / 8) * 8
  );

  for (const byte of decimalBytes) {
    let currentDecimal = byte;
    let baseNChunk = "";

    while (currentDecimal > 0) {
      const remainder = currentDecimal % base;
      baseNChunk = remainder.toString() + baseNChunk;
      currentDecimal = Math.floor(currentDecimal / base);
    }

    baseNString += baseNChunk.padStart(digitsPerByte, "0");
  }
  return baseNString;
}

// --- Base Conversion Helper (Base N to Base 10) ---
function baseNToDecimal(baseNString, base) {
  const decimalBytes = [];
  const digitsPerByte = Math.ceil(
    (((8 / Math.log2(base)) * Math.log2(base)) / 8) * 8
  );

  if (baseNString.length % digitsPerByte !== 0) {
    throw new Error(
      `Base N string length (${baseNString.length}) is not a multiple of the required digits per byte (${digitsPerByte}).`
    );
  }

  for (let i = 0; i < baseNString.length; i += digitsPerByte) {
    const chunk = baseNString.substring(i, i + digitsPerByte);

    let decimalValue = 0;
    let power = 0;

    for (let j = chunk.length - 1; j >= 0; j--) {
      const digit = parseInt(chunk[j]);
      if (digit >= base || isNaN(digit)) {
        throw new Error(`Invalid digit '${chunk[j]}' found for Base ${base}.`);
      }
      decimalValue += digit * Math.pow(base, power);
      power++;
    }

    decimalBytes.push(decimalValue);
  }

  return decimalBytes;
}

// --- Full UTF-8 Text to Decimal Bytes ---
function textToDecimalBytes(text) {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(text));
}

// --- Decimal Bytes to Full UTF-8 Text ---
function decimalBytesToText(decimalBytes) {
  const bytes = new Uint8Array(decimalBytes);
  const decoder = new TextDecoder("utf-8");
  return decoder.decode(bytes);
}

// ===============================================
// --- missLiEncode (The public function) ---
// ===============================================
function missLiEncode() {
  const dictionary = getDictionary();
  const base = dictionary.length;
  const outputElement = document.getElementById("miss-li-output");

  if (base < 2) {
    outputElement.value =
      "Error: Please select or enter at least two dictionary words (Base 2 or higher) to encode.";
    return;
  }

  const inputElement = document.getElementById("miss-li-input");
  const inputText = inputElement.value;

  if (!inputText) {
    outputElement.value = "Error: Input text is empty.";
    return;
  }

  try {
    const decimalBytes = textToDecimalBytes(inputText);
    const baseNString = decimalToBaseN(decimalBytes, base);

    let encodedText = baseNString;

    for (let i = base - 1; i >= 0; i--) {
      const digit = i.toString();
      const word = dictionary[i];

      encodedText = encodedText.replace(new RegExp(digit, "g"), `${word} `);
    }

    outputElement.value = encodedText.trim();
  } catch (e) {
    outputElement.value = "Encoding Error: " + e.message;
  }
}

// ===============================================
// --- missLiDecode (The public function) ---
// ===============================================
function missLiDecode() {
  const dictionary = getDictionary();
  const base = dictionary.length;
  const outputElement = document.getElementById("miss-li-output");

  if (base < 2) {
    outputElement.value =
      "Error: Please select or enter at least two dictionary words (Base 2 or higher) to decode.";
    return;
  }

  const inputElement = document.getElementById("miss-li-input");
  let inputText = inputElement.value;

  if (!inputText) {
    outputElement.value = "Error: Input sequence is empty.";
    return;
  }

  try {
    let baseNString = inputText + " ";

    for (let i = base - 1; i >= 0; i--) {
      const word = dictionary[i];
      const digit = i.toString();

      // Note: We use i >= 0 to ensure the substitution order is correct
      // and we escape special regex characters in the word just in case.
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      baseNString = baseNString.replace(
        new RegExp(escapedWord + "\\s+", "g"),
        digit
      );
    }

    baseNString = baseNString.trim();

    const decimalBytes = baseNToDecimal(baseNString, base);
    const decodedText = decimalBytesToText(decimalBytes);

    outputElement.value = decodedText;
  } catch (e) {
    outputElement.value =
      "Decoding Error: " +
      e.message +
      " Check your input and dictionary and try again.";
  }
}
