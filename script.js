let model;

// API credentials
const OPENAI_API_KEY = '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';

// Load the MobileNet model
mobilenet.load().then((loadedModel) => {
    model = loadedModel;
    console.log('MobileNet model loaded successfully');
});

const imageUpload = document.getElementById('imageUpload');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const imageGrid = document.getElementById('imageGrid');
const imagePreview = document.getElementById('imagePreview');
const mobileNetResults = document.getElementById('mobileNetResults');
const openAIResults = document.getElementById('openAIResults');

imageUpload.addEventListener('change', handleImageUpload);
searchButton.addEventListener('click', searchUnsplash);

function handleImageUpload(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            displayImage(img);
            analyzeImage(img);
        };
        img.src = event.target.result;
    };

    reader.readAsDataURL(file);
}

async function searchUnsplash() {
    const query = searchInput.value.trim();
    if (!query) return;

    try {
        const response = await fetch(`https://api.unsplash.com/search/photos?query=${query}&per_page=9`, {
            headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
            }
        });
        const data = await response.json();
        displayUnsplashResults(data.results);
    } catch (error) {
        console.error('Error fetching images from Unsplash:', error);
    }
}

function displayUnsplashResults(images) {
    imageGrid.innerHTML = '';
    images.forEach(image => {
        const img = document.createElement('img');
        img.src = image.urls.small;
        img.alt = image.alt_description;
        img.addEventListener('click', () => {
            displayImage(img);
            analyzeImage(img);
        });
        imageGrid.appendChild(img);
    });
}

function displayImage(imgElement) {
    imagePreview.innerHTML = '';
    const displayedImage = imgElement.cloneNode();
    displayedImage.style.maxWidth = '100%';
    displayedImage.style.height = 'auto';
    imagePreview.appendChild(displayedImage);
}

async function analyzeImage(imgElement) {
    mobileNetResults.innerHTML = '<p class="loading">Analyzing with MobileNet...</p>';
    openAIResults.innerHTML = '<p class="loading">Analyzing with OpenAI...</p>';

    // MobileNet classification
    classifyWithMobileNet(imgElement);

    // OpenAI analysis
    const imageDataUrl = getImageDataUrl(imgElement);
    analyzeWithOpenAI(imageDataUrl);
}

async function classifyWithMobileNet(imgElement) {
    if (!model) {
        console.log('MobileNet model not loaded yet');
        return;
    }

    try {
        const predictions = await model.classify(imgElement);
        displayMobileNetResults(predictions);
    } catch (error) {
        console.error('Error classifying image with MobileNet:', error);
        mobileNetResults.innerHTML = '<p>Error analyzing image with MobileNet.</p>';
    }
}

function displayMobileNetResults(predictions) {
    mobileNetResults.innerHTML = '';
    predictions.forEach((prediction) => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item');
        resultItem.innerHTML = `${prediction.className} <span>${(prediction.probability * 100).toFixed(2)}%</span>`;
        mobileNetResults.appendChild(resultItem);
    });
}

function getImageDataUrl(imgElement) {
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.width;
    canvas.height = imgElement.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
}

async function analyzeWithOpenAI(imageDataUrl) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4-vision-preview",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: "Analyze this image and provide a detailed description." },
                            { type: "image_url", image_url: { url: imageDataUrl } }
                        ]
                    }
                ],
                max_tokens: 300
            })
        });

        if (!response.ok) {
            throw new Error('OpenAI API request failed');
        }

        const data = await response.json();
        displayOpenAIResults(data.choices[0].message.content);
    } catch (error) {
        console.error('Error analyzing image with OpenAI:', error);
        openAIResults.innerHTML = '<p>Error analyzing image with OpenAI.</p>';
    }
}

function displayOpenAIResults(analysis) {
    openAIResults.innerHTML = `<p>${analysis}</p>`;
}
