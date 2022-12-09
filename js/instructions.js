// Handle the open button.
let instructionsButton;
if (instructionsButton = document.getElementById("instructions-button")) {
    instructionsButton.onclick = function () {
        let instructions;
        if (instructions = document.getElementById("instructions-container")) {
            instructions.style.display = "block";
        }
    };
}

// Handle the close button.
let instructionsCloseButton;
if (instructionsCloseButton = document.getElementById("instructions-close-button")) {
    instructionsCloseButton.onclick = function () {
        let instructions;
        if (instructions = document.getElementById("instructions-container")) {
            instructions.style.display = "none";
        }
    };
}
