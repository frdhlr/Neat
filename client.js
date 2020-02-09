function createContexts(nbImages, imageHeight, imageWidth, ...parentElement) {
    const contexts = [];

    for(let i = 0; i < nbImages; i++) {
        const element = document.createElement("canvas");

        element.id = "canvas-" + i;
        element.width = imageWidth;
        element.height = imageHeight;

        const context = element.getContext("2d");

        if(parentElement.length === 1) {
            document.getElementById(parentElement[0]).appendChild(element);
        }
        else {
            document.body.appendChild(element);
        }

        contexts.push(context);
    }

    return contexts;
}

function createCheckBoxes(nbImages, imageWidth, ...parentElement) {
    const checkBoxes = [];

    for(let i = 0; i < nbImages; i++) {
        const element = document.createElement("input");

        element.type = 'checkbox';
        element.id = "cb-" + i;
        element.name = "cb";
        element.value = i;

        const position = (imageWidth / 2) - 6.5;

        element.style.marginLeft  = position + "px";
        element.style.marginRight = position + "px";

        if(parentElement.length === 1) {
            document.getElementById(parentElement[0]).appendChild(element);
        }
        else {
            document.body.appendChild(element);
        }

        checkBoxes.push(element);
    }

    return checkBoxes;
}

function displayImageArray(imageArray, contexts) {
    imageArray.forEach((image, index) => {
        const imageData = contexts[index].createImageData(80, 120);

        let pixel = 0;

        for(let y = 0; y < 120; y++) {
            for(let x = 0; x < 80; x++) {
                for(let c = 0; c < 4; c++) {
                    imageData.data[pixel] = image[y][x][c];
                    pixel++;
                }
            }
        }

        contexts[index].putImageData(imageData, 0, 0);
    });
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function getImagesSelected(maxImagesSelected) {
    const selectedImages = [];
    let nbChecked = 0;

    for (let i = 0; i < 15; i++) {
        const checkbox = document.getElementById('cb-' + i);

        if(nbChecked < maxImagesSelected && checkbox.checked) {
            selectedImages.push(i);
            nbChecked++
        }

        checkbox.checked = false;
    }

    return selectedImages;
}

function mutate() {
    const selectedImages  = getImagesSelected(5);
    const nbImageSelected = selectedImages.length;

    if(nbImageSelected === 0) {
        for(let i = nbImageSelected; i < 5; i++) {
            selectedImages.push(getRandomInt(0, 15));
        }
    }
    else {
        for(let i = 0; i < 5 - nbImageSelected; i++) {
            selectedImages.push(selectedImages[i]);
        }
    }

    socket.emit('mutate', selectedImages);
}

function save() {
    const selectedImages = getImagesSelected(1);
    const selectedCanvas = document.getElementById('canvas-' + selectedImages[0]);
    const canvasURL      = selectedCanvas.toDataURL();

    const newWindow = window.open(canvasURL);

}

const contexts   = createContexts(15, 120, 80, "generation");
const checkBoxes = createCheckBoxes(15, 80, "selection");
const btn_mutate = document.getElementById('mutate');
const btn_save   = document.getElementById('save');

const socket = io('http://localhost:8080', {reconnectionDelay: 300, reconnectionDelayMax: 300});

btn_mutate.addEventListener('click', mutate);
btn_save.addEventListener('click', save);

socket.emit('generate');

socket.on('imageGenerated', (imageArray) => {
    displayImageArray(imageArray, contexts);
});