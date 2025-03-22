
const topKInput = document.getElementById('topk');
const temperatureInput = document.getElementById('temperature');


const vocabulary = [
    ' blue',
    ' purple',
    ' violet',
    ' not',
    ' vio',
    ' green',
    ' Blue',
    ' gray',
    ' grey',
];

const LOGITS = [
    23.5,
    19,
    17.875,
    17.75,
    17.5,
    17.375,
    17.25,
    16.75,
    16.375,
];

const barDivs = [];
const labelDivs = [];

topKInput.addEventListener('change', updateBars);
temperatureInput.addEventListener('change', updateBars);

const container = document.getElementById('container');
for (let item of vocabulary) {
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
    const logits = [...LOGITS];
    const topk = Number.parseInt(topKInput.value);
    const temperature = Number.parseFloat(temperatureInput.value);

    const topKLogits = topK(logits, topk);
    const minValue = topKLogits.at(0);
    const filteredLogits = logits.map(logit => {
        if (logit <= minValue) {
            return Number.NEGATIVE_INFINITY;
        } else {
            return logit;
        }
    })
    const probabilities = softmaxWithTemperature(filteredLogits, temperature);
    console.log(probabilities);
    for (let i = 0; i < probabilities.length; i++) {
        if (filteredLogits[i] === Number.NEGATIVE_INFINITY) {
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
    const scaledLogits = logits.map(logit => logit / temperature)
    return softmax(scaledLogits);
}

function topK(logits, k) {
    const sortedLogits = [...logits];
    sortedLogits.sort((a, b) => b - a);
    return sortedLogits.slice(k);
}
