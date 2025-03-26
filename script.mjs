
const topKInput = document.getElementById('topk');
const temperatureInput = document.getElementById('temperature');
const topPInput = document.getElementById('topp'); // Added Top-P input
const promptSelect = document.getElementById('prompt');

const DATA = [
    {
        vocabulary: [' blue', ' purple', ' violet', ' vio', ' not', ' Blue', ' green', ' gray', ' grey', ' black'],	
        logits: [23.625, 19.125, 18, 17.625, 17.625, 17.376, 17.375, 16.75, 16.376, 16.375,]
    },
    {
        vocabulary: [' little', ' girl', ' young', ' man', ' boy', ' beautiful', ' small', ' king', ' woman', ' princess'],
        logits: [20, 19.376, 19.375, 19.25, 18.875, 18.5, 18.375, 18.125, 18, 17.75]
    },
    {
        vocabulary: [' dog', ' dogs', ' lazy', ' brown', ' cat', ' old', ',', ' puppy', '', ' snake',],
        logits: [23.375, 18.375, 18.125, 18, 17.376, 17.375, 17.001, 17, 16.625, 16.5]
    },
    {
        vocabulary: [' howling', ' blowing', ' whipping', ' whistling', ' roaring', ' strong', ' gust', ' picking', ' raging', ' screaming'],
        logits: [22.625, 21.625, 19.875, 19, 18.625, 18.625, 18.5, 18, 17.75, 17.5]
    },
    {
        vocabulary: [' blooming', ' in', ' blossoming', ' out', ' bursting', ' everywhere', ' bright', ' budding', ' all', ' starting',],
        logits: [22, 21.125, 18.625, 17.875, 17.5, 17.375, 17.125, 17, 16.75, 16.625,]
    },    
];

const barDivs = [];
const labelDivs = [];

topKInput.addEventListener('change', updateBars);
temperatureInput.addEventListener('change', updateBars);
topPInput.addEventListener('change', updateBars); // Added listener for Top-P
promptSelect.addEventListener('change', updateBars);

const container = document.getElementById('container');
for (let item of DATA[0].vocabulary) {
    const barContainer = document.createElement('div');
    barContainer.classList.add('bar-container');
    const barWrapper = document.createElement('div');
    barWrapper.classList.add('bar-wrapper');
    const bar = document.createElement('div');
    bar.style.height = '0px';
    bar.classList.add('bar');
    barWrapper.appendChild(bar);
    const label = document.createElement('div');
    label.classList.add('label');
    label.innerText = item;
    barContainer.appendChild(barWrapper);
    barContainer.appendChild(label);
    container.appendChild(barContainer);
    labelDivs.push(label);
    barDivs.push(bar);
}

updateBars()

function updateBars() {
    const index = promptSelect.selectedIndex;
    const vocabulary = DATA[index].vocabulary;
    const logits = [...DATA[index].logits];
    const topk = Number.parseInt(topKInput.value);
    const temperature = Number.parseFloat(temperatureInput.value);
    const topp = Number.parseFloat(topPInput.value); // Read Top-P value

    // Apply temperature scaling first
    const scaledLogits = logits.map(logit => logit / temperature);

    // Get indices to filter by Top-K
    const topKIndices = getTopKIndices(scaledLogits, topk);

    // Get indices to filter by Top-P
    const topPIndices = getTopPIndices(scaledLogits, topp);

    // Combine filters: keep indices present in BOTH sets
    const combinedIndices = new Set(topKIndices.filter(index => topPIndices.includes(index)));

    // Create filtered logits based on combined indices
    const filteredLogits = scaledLogits.map((logit, index) => {
        return combinedIndices.has(index) ? logit : Number.NEGATIVE_INFINITY;
    });

    // Calculate final probabilities using softmax (temperature already applied)
    const probabilities = softmax(filteredLogits);

    // Update visualization
    for (let i = 0; i < probabilities.length; i++) {
        if (!combinedIndices.has(i)) { // Check if index was filtered out
            labelDivs[i].style.opacity = 0.5;
        } else {
            labelDivs[i].style.opacity = 1;
        }
        barDivs[i].style.height = `${probabilities[i] * 100}%`;
        labelDivs[i].innerText = `${vocabulary[i]} (${(probabilities[i] * 100).toFixed(2)}%)`;
    }
}

function softmax(logits) {
    const maxLogit = Math.max(...logits);
    const exponentiated = logits.map(logit => {
        if (logit === Number.NEGATIVE_INFINITY) {
            return 0;
        } else {
            return Math.exp(logit - maxLogit);
        }
    });
    const sum = exponentiated.reduce((a, b) => a + b, 0);
    return exponentiated.map(value => value / sum);
}

function softmaxWithTemperature(logits, temperature) {
    const scaledLogits = logits.map(logit => logit / temperature);
    return softmax(scaledLogits);
}

// Helper function to get indices of top K elements
function getTopKIndices(logits, k) {
    const indices = logits.map((_, i) => i);
    indices.sort((a, b) => logits[b] - logits[a]);
    return indices.slice(0, k);
}

// Helper function to get indices for Top-P filtering
function getTopPIndices(logits, p) {
    // Calculate probabilities first (using already scaled logits)
    const probabilities = softmax(logits);

    // Pair probabilities with original indices and sort descending
    const indexedProbabilities = probabilities
        .map((prob, index) => ({ prob, index }))
        .filter(item => item.prob > 0) // Filter out zero probabilities
        .sort((a, b) => b.prob - a.prob);

    let cumulativeProb = 0;
    const topPIndices = [];

    for (const item of indexedProbabilities) {
        if (cumulativeProb < p) {
            topPIndices.push(item.index);
            cumulativeProb += item.prob;
        } else {
            // Optimization: if the next probability is the same as the last one added,
            // include it as well to handle ties fairly.
            if (item.prob === indexedProbabilities[topPIndices.length - 1]?.prob) {
                 topPIndices.push(item.index);
                 // No need to add to cumulativeProb again if we are already >= p
            } else {
                break; // Stop once cumulative probability exceeds p
            }
        }
    }
    // Ensure at least one token is always selected if p > 0
    if (topPIndices.length === 0 && p > 0 && indexedProbabilities.length > 0) {
        return [indexedProbabilities[0].index];
    }

    return topPIndices;
}
