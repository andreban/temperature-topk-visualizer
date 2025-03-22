
const topKInput = document.getElementById('topk');
const temperatureInput = document.getElementById('temperature');
const promptSelect = document.getElementById('prompt');

const DATA = [
    {
        vocabulary: [' blue', ' purple', ' violet', ' vio', ' not', ' Blue', ' green', ' gray', ' grey', ' black'],	
        logits: [23.625, 19.125, 18, 17.625, 17.625, 17.375, 17.375, 16.75, 16.375, 16.375,]
    },
    {
        vocabulary: [' little', ' girl', ' young', ' man', ' boy', ' beautiful', ' small', ' king', ' woman', ' princess'],
        logits: [20, 19.375, 19.375, 19.25, 18.875, 18.5, 18.375, 18.125, 18, 17.75]
    },
    {
        vocabulary: [' dog', ' dogs', ' lazy', ' brown', ' cat', ' old', ',', ' puppy', '', ' snake',],
        logits: [23.375, 18.375, 18.125, 18, 17.375, 17.375, 17, 17, 16.625, 16.5]
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
