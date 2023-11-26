import Pickr from '@simonwep/pickr'
import '@simonwep/pickr/dist/themes/nano.min.css'
import rawShades from './models/shadesModel'
import rawNext from './models/nextModel'
import modelWrapper from './models/wrapper/wrapper'
import Mustache from 'mustache'
import codeStub from './stubs/code.stub.html'
import shadeStub from './stubs/shade.stub.html'
import namer from './color-namer'
import chroma from 'chroma-js'
import Chart from 'chart.js';
import './chartjs-plugin-dragdata/src/index.js'
import 'chartjs-plugin-annotation'
import news from './datasets/stripe-revised';
import ClipboardJS from 'clipboard'

let nextModel = modelWrapper(rawNext);
let shadesModel = modelWrapper(rawShades);

function rgbToHex(r, g, b) {
  r = parseInt(r);
  g = parseInt(g);
  b = parseInt(b);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

const initColor = '#1D6CE4';
let palette = [];
let stopChange = false;

const pickrButton = Pickr.create({
  el: '.pickr',
  theme: 'nano', // or 'monolith', or 'nano'

  default: initColor,
  comparison: false,
  showAlways: true,
  container: '.pickr-ctrl',
  appClass: 'picker',
  useAsButton: true,
  components: {
    preview: true,
    opacity: false,
    hue: true,
    interaction: {
      input: true,
      save: false
    }
  },
  i18n: {
    'btn:save': 'Apply',
    'aria:btn:save': 'Apply',
  }
});

let options = {
  tooltips: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    callbacks: {
      label: function(tooltipItem, data) {
        return tooltipItem.yLabel.toFixed(1);

      },
      title: (tooltipItem, data) => {
        let colorName = palette[tooltipItem[0].datasetIndex].name;
        if(colorName === undefined) colorName = name(palette)[tooltipItem[0].datasetIndex]; // hotfix for error when just inputing color and dragging on chart

        return colorName.charAt(0).toUpperCase() + colorName.slice(1) + ' ' + tooltipItem[0].label;
      }
    }
  },
  aspectRatio: 3,
  maintainAspectRatio: false,
  legend: {
    display: false
  },
  title: {
    display: true,
    position: 'left',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    fontColor: 'black',
    //fontSize: '12px'
  },
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: 'Chart.js Line Chart'
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    }
  },
  dragData: true,
  dragDataRound: 1,
  dragOptions: {
    showTooltip: true
  },
  animation: {
    duration: 0
  },
  onDragEnd: function() {
    hideTooltip(luminosityCanva);
    hideTooltip(chromaCanva);
    hideTooltip(hueCanva);
    hideTooltip(contrastCanva);
    hideTooltip(contrastBlackCanva);
    hideTooltip(contrastWhiteCanva);
    setGradients(luminosityCanva);
    setGradients(chromaCanva);
    setGradients(hueCanva);
    setGradients(contrastCanva);
    setGradients(contrastWhiteCanva);
    setGradients(contrastBlackCanva);
    renderTexts();
    paintContext(palette);
  },
  hover: {
    onHover: function(e) {
      const point = this.getElementAtEvent(e);

      if (point.length) e.target.style.cursor = 'grab';
      else e.target.style.cursor = 'default';
      var item = this.getElementAtEvent(e);
      if(item.length) {
        document.querySelectorAll('.border-black').forEach(el => el.classList.remove('border-black'));

        let index = item[0]._index;
        if(index === 0) index = '0.5';
        let el = document.getElementById('output' + item[0]._datasetIndex + index);
        el.classList.add('border-black');

      } else {
        document.querySelectorAll('.border-black').forEach(el => el.classList.remove('border-black'));
      }
    },

  },
  scales: {
    yAxes: [{
      ticks: {
        beginAtZero: true,
        max: 100,
      }
    }],
    xAxes: [{
      ticks: {
        //fontSize: 10
      // autoSkip: false,
        //maxRotation: 45,
        //minRotation: 45
      }
    }],
    x: {
      display: true,
      scaleLabel: {
        display: true,
      }
    },
    y: {
      display: true,
      scaleLabel: {
        display: true,
      }
    }
  }
};

options.onDrag = (e, datasetIndex, index, value) => {
  e.target.style.cursor = 'grabbing';
  editLuminosity(datasetIndex, index, value);

  grayOutLines(luminosityCanva, datasetIndex);
  grayOutLines(chromaCanva, datasetIndex);
  grayOutLines(hueCanva, datasetIndex);
  grayOutLines(contrastCanva, datasetIndex);
  grayOutLines(contrastBlackCanva, datasetIndex);
  grayOutLines(contrastWhiteCanva, datasetIndex);
};
options.title.text = 'Luminosity';

let luminosityCanva = new Chart('luminosity-canva', {
  type: 'line',
  data: {
    labels: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
  },
  options: options
});

options.onDrag = function(e, datasetIndex, index, value) {
  e.target.style.cursor = 'grabbing';
  editChroma(datasetIndex, index, value);
  grayOutLines(luminosityCanva, datasetIndex);
  grayOutLines(chromaCanva, datasetIndex);
  grayOutLines(hueCanva, datasetIndex);
  grayOutLines(contrastCanva, datasetIndex);
  grayOutLines(contrastBlackCanva, datasetIndex);
  grayOutLines(contrastWhiteCanva, datasetIndex);
};
options.scales.yAxes[0].ticks.max = 110;
options.scales.yAxes[0].ticks.stepSize = 10;

options.title.text = 'Chroma';

let chromaCanva = new Chart('chroma-canva', {
  type: 'line',
  data: {
    labels: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']
  },
  options: options
});

options.onDrag = function(e, datasetIndex, index, value) {
  e.target.style.cursor = 'grabbing';
  editHue(datasetIndex, index, value, 'hue');
  grayOutLines(luminosityCanva, datasetIndex);
  grayOutLines(chromaCanva, datasetIndex);
  grayOutLines(hueCanva, datasetIndex);
  grayOutLines(contrastCanva, datasetIndex);
  grayOutLines(contrastBlackCanva, datasetIndex);
  grayOutLines(contrastWhiteCanva, datasetIndex);
};
options.scales.yAxes[0].ticks.max = 360;
options.scales.yAxes[0].ticks.stepSize = 40;
options.title.text = 'Hue';
let hueCanva = new Chart('hue-canva', {
  type: 'line',
  data: {
    labels: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']
  },
  options: options
});

options.scales.yAxes[0].ticks.max = 2;
options.scales.yAxes[0].ticks.min = 1;
options.scales.yAxes[0].ticks.stepSize = 0.1;
options.title.text = 'Contrast WCAG';
options.dragData = false;
options.tooltips.callbacks.label = function(tooltipItem, data) {return tooltipItem.yLabel.toFixed(2);};
options.annotation = {
  annotations: [{
    type: 'box',
    drawTime: 'beforeDatasetsDraw',
    yScaleID: 'y-axis-0',
    xScaleID: 'x-axis-0',
    yMin: 1,
    yMax: 1.3,
    xMin: 3,
    xMax: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  },{
    type: 'box',
    drawTime: 'beforeDatasetsDraw',
    yScaleID: 'y-axis-0',
    xScaleID: 'x-axis-0',
    yMin: 1,
    yMax: 1.4,
    xMin: 4,
    xMax: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  },{
    type: 'box',
    drawTime: 'beforeDatasetsDraw',
    yScaleID: 'y-axis-0',
    xScaleID: 'x-axis-0',
    yMin: 1,
    yMax: 1.2,
    xMin: 8,
    xMax: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  }]
};
let contrastCanva = new Chart('contrast-canva', {
  type: 'line',
  data: {
    labels: ['White-50', '50-100', '100-200', '200-300', '300-400', '400-500', '500-600', '600-700', '700-800', '800-900', '900-Black']
  },
  options: options
});

options.scales.yAxes[0].ticks.max = 20;
options.scales.yAxes[0].ticks.min = 1;
options.scales.yAxes[0].ticks.stepSize = 1;
options.title.text = 'Contrast WCAG over White';
options.annotation = {
  annotations: [{
    type: 'box',
    drawTime: 'beforeDatasetsDraw',
    yScaleID: 'y-axis-0',
    xScaleID: 'x-axis-0',
    yMin: 1,
    yMax: 3,
    xMin: 4,
    xMax: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  },{
    type: 'box',
    drawTime: 'beforeDatasetsDraw',
    yScaleID: 'y-axis-0',
    xScaleID: 'x-axis-0',
    yMin: 4.7,
    //yMax: 4.5,
    xMax: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  },{
    type: 'box',
    drawTime: 'beforeDatasetsDraw',
    yScaleID: 'y-axis-0',
    xScaleID: 'x-axis-0',
    yMin: 1,
    yMax: 4.3,
    xMin: 5,
    xMax: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  },{
    type: 'box',
    drawTime: 'beforeDatasetsDraw',
    yScaleID: 'y-axis-0',
    xScaleID: 'x-axis-0',
    yMin: 1,
    yMax: 7,
    xMin: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  }]
};
let contrastWhiteCanva = new Chart('contrast-white-canva', {
  type: 'line',
  data: {
    labels: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']
  },
  options: options
});

options.scales.yAxes[0].ticks.max = 20;
options.scales.yAxes[0].ticks.min = 1;
options.title.text = 'Contrast WCAG over Black';
options.annotation = {
  annotations: [{
    type: 'box',
    drawTime: 'beforeDatasetsDraw',
    yScaleID: 'y-axis-0',
    xScaleID: 'x-axis-0',
    yMin: 1,
    yMax: 4.5,
    xMax: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  }]
};
let contrastBlackCanva = new Chart('contrast-black-canva', {
  type: 'line',
  data: {
    labels: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']
  },
  options: options
});

window.addEventListener('click', function(e){
  if (document.querySelector('.palette-grid').contains(e.target)
    || document.querySelector('.pickr-ctrl').contains(e.target)
    || document.getElementById('luminosity-canva').contains(e.target)
    || document.getElementById('chroma-canva').contains(e.target)
    || document.getElementById('hue-canva').contains(e.target)
    || document.getElementById('contrast-canva').contains(e.target)
    || document.getElementById('contrast-black-canva').contains(e.target)
    || document.getElementById('contrast-white-canva').contains(e.target)
  ){
    // Clicked in box
  } else{
    // Clicked outside the box
    //showAllLines();
  }
});

function openTooltip(chart, index, test) {
  let mouseMoveEvent, meta, point, rectangle;

  meta = chart.getDatasetMeta(index);
  rectangle = chart.canvas.getBoundingClientRect();
  point = meta.data[test].getCenterPoint();

  mouseMoveEvent = new MouseEvent('mousemove', {
    clientX: rectangle.left + point.x,
    clientY: rectangle.top + point.y
  });

  chart.canvas.dispatchEvent(mouseMoveEvent);
}

function closeTooltip(chart) {
  let mouseOutEvent = new MouseEvent('mouseout');
  return chart.canvas.dispatchEvent(mouseOutEvent);
}

function hideTooltip(chart) {
  chart.options.tooltips.enabled = false;
  chart.update();
}

function showLine(col) {
  col = parseInt(col);

  let hidden = hiddenDatasets(luminosityCanva.data.datasets);

  if(hidden.length === 0){
    palette.forEach((color, key) => {
      luminosityCanva.data.datasets[key].hidden = true;
      chromaCanva.data.datasets[key].hidden = true;
      hueCanva.data.datasets[key].hidden = true;
      contrastCanva.data.datasets[key].hidden = true;
      contrastWhiteCanva.data.datasets[key].hidden = true;
      contrastBlackCanva.data.datasets[key].hidden = true;

      if (key === col) {
        luminosityCanva.data.datasets[key].hidden = !luminosityCanva.data.datasets[key].hidden;
        chromaCanva.data.datasets[key].hidden = !chromaCanva.data.datasets[key].hidden;
        hueCanva.data.datasets[key].hidden = !hueCanva.data.datasets[key].hidden;
        contrastCanva.data.datasets[key].hidden = !contrastCanva.data.datasets[key].hidden;
        contrastWhiteCanva.data.datasets[key].hidden = !contrastWhiteCanva.data.datasets[key].hidden;
        contrastBlackCanva.data.datasets[key].hidden = !contrastBlackCanva.data.datasets[key].hidden;
      } else {
        document.getElementById('name' + key).classList.remove('bg-yellow-300');
      }
    });
  } else if(hidden.length + 1 === palette.length && !hidden.includes(col)){
    palette.forEach((color, key) => {
      luminosityCanva.data.datasets[key].hidden = false;
      chromaCanva.data.datasets[key].hidden = false;
      hueCanva.data.datasets[key].hidden = false;
      contrastCanva.data.datasets[key].hidden = false;
      contrastWhiteCanva.data.datasets[key].hidden = false;
      contrastBlackCanva.data.datasets[key].hidden = false;
      document.getElementById('name' + key).classList.add('bg-yellow-300');
    })

  } else {
    palette.forEach((color, key) => {
      if (key === col) {
        luminosityCanva.data.datasets[key].hidden = !luminosityCanva.data.datasets[key].hidden;
        chromaCanva.data.datasets[key].hidden = !chromaCanva.data.datasets[key].hidden;
        hueCanva.data.datasets[key].hidden = !hueCanva.data.datasets[key].hidden;
        contrastCanva.data.datasets[key].hidden = !contrastCanva.data.datasets[key].hidden;
        contrastWhiteCanva.data.datasets[key].hidden = !contrastWhiteCanva.data.datasets[key].hidden;
        contrastBlackCanva.data.datasets[key].hidden = !contrastBlackCanva.data.datasets[key].hidden;
        document.getElementById('name' + key).classList.toggle('bg-yellow-300');
      }
    });
  }

  luminosityCanva.update();
  chromaCanva.update();
  hueCanva.update();
  contrastCanva.update();
  contrastBlackCanva.update();
  contrastWhiteCanva.update();
}

function hiddenDatasets(datasets)
{
  let hidden = [];
  datasets.forEach((dataset, key) => {
    if(dataset.hidden) hidden.push(key);
  });

  return hidden;
}

function selectedFamily(datasets)
{
  let selected = [];
  datasets.forEach((dataset, key) => {
    if(!dataset.hidden) selected.push(key);
  });

  if(selected.length === 1) return selected[0];

  return null;
}

function showAllLines() {
  luminosityCanva.data.datasets.forEach((dataset, key) => {
    dataset.hidden = false;
  });
  chromaCanva.data.datasets.forEach((dataset, key) => {
    dataset.hidden = false;
  });
  hueCanva.data.datasets.forEach((dataset, key) => {
    dataset.hidden = false;
  });
  contrastCanva.data.datasets.forEach((dataset, key) => {
    dataset.hidden = false;
  });
  contrastWhiteCanva.data.datasets.forEach((dataset, key) => {
    dataset.hidden = false;
  });
  contrastBlackCanva.data.datasets.forEach((dataset, key) => {
    dataset.hidden = false;
  });

  luminosityCanva.update();
  chromaCanva.update();
  hueCanva.update();
  contrastCanva.update();
  contrastWhiteCanva.update();
  contrastBlackCanva.update();
}

let color0 = shadesModel(initColor);

let outputs = calculateColorsHorizontally(initColor, color0);

outputs = [color0]

// outputs = [];
// let outputShades = [];
// let i = 0;
//
// for (const colors in news) {
//   if(i < 10) {
//     outputShades[i] = {};
//     for(const shade in news[colors]){
//       outputShades[i]['r' + shade/100] = chroma.hex(news[colors][shade]).rgb()[0]/255;
//       outputShades[i]['g' + shade/100] = chroma.hex(news[colors][shade]).rgb()[1]/255;
//       outputShades[i]['b' + shade/100] = chroma.hex(news[colors][shade]).rgb()[2]/255;
//     }
//     i++;
//   }
// }
//
// outputs = outputShades;

let brandColor = calculateBrandColor(initColor, outputs);

normalizeToLCH(outputs);
paint(palette);
renderTexts();
toCharts();

pickrButton.on('change', (color, source) => {
  if(stopChange) return;
  color0 = shadesModel(color.toHEXA().toString());

  //outputs = calculateColorsHorizontally(color.toHEXA().toString(), color0);
  //outputs = [color0];

  let familyShown = selectedFamily(luminosityCanva.data.datasets);
  let familySelected = document.querySelector('#color-palette .color-row:not(.border-white)').dataset.familyIndex;
  palette[familySelected] = normalizeFamily(color0)
  outputs[familySelected] = color0;

  // if(familySelected !== null) {
  //   palette[familySelected] = normalizeFamily(color0)
  //   outputs[familySelected] = color0;
  // } else {
  //   outputs[outputs.length - 1] = color0;
  //   palette[palette.length - 1] = normalizeFamily(color0)
  // }
  brandColor = calculateBrandColor(color.toHEXA().toString(), outputs);

  //normalizeToLCH(outputs);
  paint(palette);
  //changeFavicon(color.toHEXA().toString())

  if(source.changeSource === 'input'){
    renderTexts();
  }

  toCharts();
  paintContext(palette);
  original = [palette[0][6][0], palette[0][6][2]];
  //console.log(hsluv)
});

let original = [palette[0][6][0], palette[0][6][2]];

document.getElementById('shadeSaturation').addEventListener('input', (e) => {

  let color = chroma.lch(original[0], e.target.value, original[1]).hex().toUpperCase();
  color0 = shadesModel(color);

  outputs[0] = color0;
  //outputs = calculateColorsHorizontally(color, color0);
  brandColor = calculateBrandColor(color, outputs);

  normalizeToLCH(outputs);
  paint(palette);
  //changeFavicon(color.toHEXA().toString())

  renderTexts();

  toCharts();
  paintContext(palette);
});

document.getElementById('straightHueBtn').addEventListener('click', () => {
  let sum = 0;

  palette[0].forEach((color) => {
    sum += color[2]
  });

  let mean = sum/palette[0].length;

  palette[0].map((color, index) => {
    color[2] = mean;
    editHue(0, index, mean);
    return color;
  });

  renderTexts();
  paintContext(palette);
});

pickrButton.on('changestop', (color, instance) => {
  renderTexts();
});

function calculateColorsHorizontally(initColor, color0)
{
  return [color0];
  let next = nextModel(initColor);
  let color1 = shadesModel(rgbToHex(next.r1*255, next.g1*255,next.b1*255));
  let color2 = shadesModel(rgbToHex(next.r2*255, next.g2*255,next.b2*255));
  let color3 = shadesModel(rgbToHex(next.r3*255, next.g3*255,next.b3*255));
  let color4 = shadesModel(rgbToHex(next.r4*255, next.g4*255,next.b4*255));
  let color5 = shadesModel(rgbToHex(next.r5*255, next.g5*255,next.b5*255));
  let color6 = shadesModel(rgbToHex(next.r6*255, next.g6*255,next.b6*255));
  let color7 = shadesModel(rgbToHex(next.r7*255, next.g7*255,next.b7*255));
  let color8 = shadesModel(rgbToHex(next.r8*255, next.g8*255,next.b8*255));
  let color9 = shadesModel(rgbToHex(next.r9*255, next.g9*255,next.b9*255));

  return [color0, color1, color2, color3, color4, color5, color6, color7, color8, color9];
}

function calculateBrandColor(hex, outputs)
{
  let distances = {};

  for(let i = 0; i < 10; i++){
    let j = 0;
    i === 0 ? j = 0.5 : j = i;

    outputs.forEach((output, index) => {
      distances[index.toString() + j] = chroma.deltaE(rgbToHex(output['r' + j]*255, output['g' + j]*255, output['b' + j]*255), hex);
    });
    // distances['0' + j] = chroma.deltaE(rgbToHex(outputs[0]['r' + j]*255, outputs[0]['g' + j]*255, outputs[0]['b' + j]*255), hex);
    // distances['1' + j] = chroma.deltaE(rgbToHex(outputs[1]['r' + j]*255, outputs[1]['g' + j]*255, outputs[1]['b' + j]*255), hex);
    // distances['2' + j] = chroma.deltaE(rgbToHex(outputs[2]['r' + j]*255, outputs[2]['g' + j]*255, outputs[2]['b' + j]*255), hex);
    // distances['3' + j] = chroma.deltaE(rgbToHex(outputs[3]['r' + j]*255, outputs[3]['g' + j]*255, outputs[3]['b' + j]*255), hex);
    // distances['7' + j] = chroma.deltaE(rgbToHex(outputs[7]['r' + j]*255, outputs[7]['g' + j]*255, outputs[7]['b' + j]*255), hex);
    // distances['8' + j] = chroma.deltaE(rgbToHex(outputs[8]['r' + j]*255, outputs[8]['g' + j]*255, outputs[8]['b' + j]*255), hex);
    // distances['9' + j] = chroma.deltaE(rgbToHex(outputs[9]['r' + j]*255, outputs[9]['g' + j]*255, outputs[9]['b' + j]*255), hex);
  }

  let sortable = [];
  for (let distance in distances) {
    sortable.push([distance, distances[distance]]);
  }

  sortable.sort(function(a, b) {
    return a[1] - b[1];
  });

  let index = sortable[0][0].slice(1);
  let colorIndex = sortable[0][0].slice(0, 1);

  brandColor = {index, color: colorIndex, fit: false, similar: [], hex: hex, distance: sortable[0][1]};

  sortable.forEach((match) => {
    if(match[0].slice(0, 1) === colorIndex) brandColor.similar.push(match)
  });

  let replace = chroma(hex).rgb();

  //if(palette.length) palette[colorIndex][index] = [chroma(hex).lch()[0], chroma(hex).lch()[1], chroma(hex).lch()[2]]

  if(sortable[0][1] < 100){ // 9.5 will fit 79% of the colors

    brandColor.fit = true;

    outputs[colorIndex]['r' + index] = replace[0]/255;
    outputs[colorIndex]['g' + index] = replace[1]/255;
    outputs[colorIndex]['b' + index] = replace[2]/255;
  }

  return brandColor;
}

function renderTexts()
{
  let names = name(palette);

  //displayHex();

  if(brandColor.fit){
    document.getElementById('brand').innerHTML = '.bg-' + names[brandColor.color] + '-' + brandColor.index*100;
    document.getElementById('fit').classList.add('hidden');
  } else {
    document.getElementById('brand').innerHTML = '.bg-brand';
    document.getElementById('fit').classList.remove('hidden');

    let leftFit = '.bg-' + names[brandColor.similar[0][0].slice(0, 1)] + '-' + brandColor.similar[0][0].slice(1)*100;
    let rightFit = '.bg-' + names[brandColor.similar[1][0].slice(0, 1)] + '-' + brandColor.similar[1][0].slice(1)*100;

    document.getElementById('fits-between').innerHTML = leftFit + ' and ' + rightFit;
  }

  code(names, brandColor.hex);
}

function code(names)
{
  let colors = [];

  names.forEach((name, key) => {
    colors.push({
      name: name,
      '50':  chroma.lch(palette[key][0][0], palette[key][0][1], palette[key][0][2]).hex(),
      '100': chroma.lch(palette[key][1][0], palette[key][1][1], palette[key][1][2]).hex(),
      '200': chroma.lch(palette[key][2][0], palette[key][2][1], palette[key][2][2]).hex(),
      '300': chroma.lch(palette[key][3][0], palette[key][3][1], palette[key][3][2]).hex(),
      '400': chroma.lch(palette[key][4][0], palette[key][4][1], palette[key][4][2]).hex(),
      '500': chroma.lch(palette[key][5][0], palette[key][5][1], palette[key][5][2]).hex(),
      '600': chroma.lch(palette[key][6][0], palette[key][6][1], palette[key][6][2]).hex(),
      '700': chroma.lch(palette[key][7][0], palette[key][7][1], palette[key][7][2]).hex(),
      '800': chroma.lch(palette[key][8][0], palette[key][8][1], palette[key][8][2]).hex(),
      '900': chroma.lch(palette[key][9][0], palette[key][9][1], palette[key][9][2]).hex()
    });
  });

  let renderedCode = Mustache.render(codeStub, {colors, brandColor, unfit: !brandColor.fit});
  document.querySelector('.code').innerHTML = renderedCode;
}

function paint(palette)
{
  palette.forEach((colors, i) => {
    colors.forEach((color, j) => {
      let index = j;
      if(j === 0) index = 0.5;

      let colorElement = document.getElementById('output' + i + index);

      if(colorElement) {
        colorElement.style.backgroundColor = chroma.lch(color).hex();
      } else {
        let paletteElement = document.getElementById('color-palette');

        paletteElement.appendChild(createElementFromHTML('<div data-family-index="' + i + '" class="box-border border-2 rounded-md color-row text-sm w-full sm:w-auto flex flex-row items-start" id="shade-parent-' + i  +'"></div>'));

        let shadeElement = document.getElementById('shade-parent-' + i);
        shadeElement.innerHTML = Mustache.render(shadeStub, {color: i, uuid: Math.floor(Math.random() * 10000000000000000)});

        document.getElementById('name' + i).addEventListener('click', () => {
          showLine(shadeElement.dataset.familyIndex);
        });

        shadeElement.querySelector('.family-swatches').addEventListener('click', () => {
          paletteElement.childNodes.forEach((el, key) => {
            el.classList.add('border-white');
            if(key === i) el.classList.remove('border-white')
          });

          stopChange = true;
          pickrButton.setColor(chroma.lch(palette[i][5]).hex());
          stopChange = false;
        });

        document.getElementById('delete' + i).addEventListener('click', () => {
          deleteFamilyColor(i);
        });

        shadeElement.addEventListener('mouseover', (e) => {
          let hidden = hiddenDatasets(luminosityCanva.data.datasets);
          let dataset = parseInt(e.target.dataset.colorFamily);
          let index = parseInt(e.target.dataset.color);

          if(!isNaN(dataset) && hidden.length === luminosityCanva.data.datasets.length - 1 && !hidden.includes(dataset)) {
            openTooltip(luminosityCanva, dataset, index)
            openTooltip(chromaCanva, dataset, index)
            openTooltip(hueCanva, dataset, index)
            openTooltip(contrastCanva, dataset, index)
            openTooltip(contrastBlackCanva, dataset, index)
            openTooltip(contrastWhiteCanva, dataset, index)
          }
        });

        document.getElementById('shade' + i).addEventListener('mouseleave', (e) => {
          //let hidden = hiddenDatasets(luminosityCanva.data.datasets);
          //let target = parseInt(e.target.id.substr(6, 1));
          //if(target && hidden.length === 9 && !hidden.includes(target)) openTooltip(luminosityCanva, e.target.id.substr(6, 1), e.target.id.substr(7, 1))
          closeTooltip(luminosityCanva);
          closeTooltip(chromaCanva);
          closeTooltip(hueCanva);
          closeTooltip(contrastCanva);
          closeTooltip(contrastBlackCanva);
          closeTooltip(contrastWhiteCanva);
        });

        document.getElementById('output' + i + index).style.backgroundColor = chroma.lch(color).hex();
      }
    });
  });
}

function createElementFromHTML(htmlString) {
  let div = document.createElement('div');
  div.innerHTML = htmlString.trim();

  return div.firstChild;
}

function name(palette)
{
  let names = [];

  palette.forEach((color, i) => {
    let namings = namer(chroma.lch(color[5]).hex(), { pick: ['basic']}).basic;
    let name = namings[0].name;

    if(names.includes(name)) name = namings[1].name;
    if(names.includes(name)) name = namings[2].name;
    if(names.includes(name)) name = namings[3].name;
    if(names.includes(name)) name = namings[4].name;
    if(names.includes(name)) name = namings[5].name;

    names.push(name);

    document.getElementById('name' + i).innerHTML = names[i];
  });

  palette.forEach((color, key) => {
    palette[key]['name'] = names[key];
  });

  return names;
}

let link = document.querySelector("link[rel~='icon']");
let canvas = document.createElement("canvas");
let context = canvas.getContext("2d");

function changeFavicon(hex) {
  canvas.width = 16;
  canvas.height = 16;
  context.fillStyle = hex;
  context.fillRect(0, 0, 16, 16);
  context.fill();
  link.type = "image/x-icon";
  link.href = canvas.toDataURL();
}

function calculateBrandColorFit () {
  let zero=0, one=0, two=0, three=0, four=0, five=0, six=0, nine=0, eight=0, seven = 0;
  let dist = [];
  let it = 1000;
  for (let i = 0; i < it; i++) {
    let randomColor = rgbToHex(Math.random()*255, Math.random()*255, Math.random()*255);

    let first = shadesModel(randomColor);
    let now = calculateColorsHorizontally(randomColor, first);
    let brand = calculateBrandColor(randomColor, now)
    dist.push(Math.round(brand.distance))
    if(brand.fit == true) {
      console.log('fit')
      if(brand.color == 0) zero++
      if(brand.color == 1) one++
      if(brand.color == 2) two++
      if(brand.color == 3) three++
      if(brand.color == 4) four++
      if(brand.color == 5) five++
      if(brand.color == 6) six++
      if(brand.color == 7) seven++
      if(brand.color == 8) eight++
      if(brand.color == 9) nine++
    };
  }

  console.log(
    zero/it*100,
    one/it*100,
    two/it*100,
    three/it*100,
    four/it*100,
    five/it*100,
    six/it*100,
    seven/it*100,
    eight/it*100,
    nine/it*100,
  )

  var counts = {};
  dist.forEach(function(x) { counts[x] = (counts[x] || 0)+1; });
  console.log(counts)
}

function normalizeToLCH(inputs){
  palette = [];

  inputs.forEach((color) => {
    palette.push([
      chroma(color['r0.5']*255, color['g0.5']*255, color['b0.5']*255).lch(),
      chroma(color.r1*255, color.g1*255, color.b1*255).lch(),
      chroma(color.r2*255, color.g2*255, color.b2*255).lch(),
      chroma(color.r3*255, color.g3*255, color.b3*255).lch(),
      chroma(color.r4*255, color.g4*255, color.b4*255).lch(),
      chroma(color.r5*255, color.g5*255, color.b5*255).lch(),
      chroma(color.r6*255, color.g6*255, color.b6*255).lch(),
      chroma(color.r7*255, color.g7*255, color.b7*255).lch(),
      chroma(color.r8*255, color.g8*255, color.b8*255).lch(),
      chroma(color.r9*255, color.g9*255, color.b9*255).lch(),
    ])
  });

  return palette;
}

function normalizeFamily(color)
{
  return [
    chroma(color['r0.5']*255, color['g0.5']*255, color['b0.5']*255).lch(),
    chroma(color.r1*255, color.g1*255, color.b1*255).lch(),
    chroma(color.r2*255, color.g2*255, color.b2*255).lch(),
    chroma(color.r3*255, color.g3*255, color.b3*255).lch(),
    chroma(color.r4*255, color.g4*255, color.b4*255).lch(),
    chroma(color.r5*255, color.g5*255, color.b5*255).lch(),
    chroma(color.r6*255, color.g6*255, color.b6*255).lch(),
    chroma(color.r7*255, color.g7*255, color.b7*255).lch(),
    chroma(color.r8*255, color.g8*255, color.b8*255).lch(),
    chroma(color.r9*255, color.g9*255, color.b9*255).lch(),
  ]
}

function toCharts()
{
  let luminosities = [];
  let chromas = [];
  let hues = [];
  let contrasts = [];
  let contrastsBlack = [];
  let contrastsWhite = [];

  palette.forEach((color, key) => {
    luminosities[key] = [];
    chromas[key] = [];
    hues[key] = [];
    contrasts[key] = [];
    contrastsBlack[key] = [];
    contrastsWhite[key] = [];

    color.forEach((shade, shadeKey) => {
      luminosities[key].push(shade[0]);
      chromas[key].push(shade[1]);
      hues[key].push(shade[2]);

      if(shadeKey > 0 && shadeKey <= 9) {
        contrasts[key].push(chroma.contrast(chroma.lch(color[shadeKey - 1]), chroma.lch(shade).hex()));
      } else if(shadeKey === 0){
        contrasts[key].push(chroma.contrast('#ffffff', chroma.lch(color[shadeKey]).hex()));
      }
      if(shadeKey === 9){
        contrasts[key].push(chroma.contrast('#000000', chroma.lch(color[shadeKey]).hex()));
      }
      contrastsWhite[key].push(chroma.contrast('#ffffff', chroma.lch(color[shadeKey]).hex()));
      contrastsBlack[key].push(chroma.contrast('#000000', chroma.lch(color[shadeKey]).hex()));
    });
  });

  updateChart(luminosityCanva, luminosities);
  updateChart(chromaCanva, chromas);
  updateChart(hueCanva, hues);
  updateChart(contrastCanva, contrasts);
  updateChart(contrastWhiteCanva, contrastsWhite);
  updateChart(contrastBlackCanva, contrastsBlack);
}

function createGradient(colorIndex)
{
  let ctx = document.getElementById('luminosity-canva').getContext("2d");
  let gradient = ctx.createLinearGradient(0, 0, 560, 0);

  gradient.addColorStop(0.09,  chroma.lch(palette[colorIndex][0]).css());
  gradient.addColorStop(0.17,  chroma.lch(palette[colorIndex][1]).css());
  gradient.addColorStop(0.27,  chroma.lch(palette[colorIndex][2]).css());
  gradient.addColorStop(0.37,  chroma.lch(palette[colorIndex][3]).css());
  gradient.addColorStop(0.485, chroma.lch(palette[colorIndex][4]).css());
  gradient.addColorStop(0.6,   chroma.lch(palette[colorIndex][5]).css());
  gradient.addColorStop(0.7,   chroma.lch(palette[colorIndex][6]).css());
  gradient.addColorStop(0.8,   chroma.lch(palette[colorIndex][7]).css());
  gradient.addColorStop(0.91,  chroma.lch(palette[colorIndex][8]).css());
  gradient.addColorStop(1,     chroma.lch(palette[colorIndex][9]).css());

  return gradient;
}

function setGradients(chart)
{
  let colors = [];

  palette.forEach((shades, index) => {
    colors.push(shades.map((color) => { return chroma.lch(color[0],color[1],color[2]).hex()}));
    colors[index].push('#000000');
    chart.data.datasets[index].borderColor = createGradient(index);
  });

  chart.data.datasets.forEach((data, index) => {
    chart.data.datasets[index].pointBackgroundColor = colors[index];
    chart.data.datasets[index].pointBorderColor = colors[index];
  });

  chart.update()
}

function updateChart(chart, values)
{
  let colors = [];
  palette.forEach((shades, index) => {
    colors.push(shades.map((color) => { return chroma.lch(color[0],color[1],color[2]).hex()}));
    colors[index].push('#000000');

    let hidden = false;
    if(chart.data.datasets[index]) hidden = chart.data.datasets[index].hidden;

    chart.data.datasets[index] = {
      data: values[index],
      fill: false,
      pointBackgroundColor: colors[index],
      pointBorderColor: colors[index],
      borderColor: createGradient(index),
      hidden: hidden
    }
  });

  chart.update();
}

function updateColorInChart(chart, dataset, index, value, color) {
  chart.data.datasets[dataset].data[index] = value;
  chart.data.datasets[dataset].pointBackgroundColor[index] = color;
  chart.data.datasets[dataset].borderColor = createGradient(dataset);

  chart.update();
}

function editLuminosity(dataset, index, value){
  let idIndex = index;
  if(index === 0) idIndex = '0.5';

  let id = 'output' + dataset + idIndex;

  let el = document.getElementById(id);
  let initialColor = el.style.backgroundColor;

  let initialLCH = chroma(initialColor).lch();
  initialLCH[0] = value;

  let finalColor = chroma.lch(initialLCH);
  el.style.backgroundColor = finalColor.css();

  palette[dataset][index] = finalColor.lch();

  updateColorInChart(luminosityCanva, dataset, index, finalColor.lch()[0], finalColor.hex());
  updateColorInChart(chromaCanva, dataset, index, finalColor.lch()[1], finalColor.hex());
  updateColorInChart(hueCanva, dataset, index, finalColor.lch()[2], finalColor.hex());

  if(index === 0){
    updateColorInChart(contrastCanva, dataset, 0, chroma.contrast('white', finalColor.hex()), finalColor.hex());
    updateColorInChart(contrastCanva, dataset, 1, chroma.contrast(chroma.lch(palette[dataset][0]).hex(), chroma.lch(palette[dataset][1]).hex()), finalColor.hex());
  } else if(index > 0 && index < 9){
    updateColorInChart(contrastCanva, dataset, index, chroma.contrast(chroma.lch(palette[dataset][index - 1]).hex(), finalColor.hex()), finalColor.hex());
    updateColorInChart(contrastCanva, dataset, index + 1, chroma.contrast(chroma.lch(palette[dataset][index + 1]).hex(), finalColor.hex()), finalColor.hex());
  } else if(index === 9){
    updateColorInChart(contrastCanva, dataset, 9, chroma.contrast(chroma.lch(palette[dataset][8]).hex(), finalColor.hex()), finalColor.hex());
    updateColorInChart(contrastCanva, dataset, 10, chroma.contrast('#000000', finalColor.hex()), finalColor.hex());
  }

  updateColorInChart(contrastBlackCanva, dataset, index, chroma.contrast('#000000', finalColor.hex()), finalColor.hex());
  updateColorInChart(contrastWhiteCanva, dataset, index, chroma.contrast('#ffffff', finalColor.hex()), finalColor.hex());
}

function editChroma(dataset, index, value){
  let idIndex = index;
  if(index === 0) idIndex = '0.5';

  let id = 'output' + dataset + idIndex;

  let el = document.getElementById(id);
  let initialColor = el.style.backgroundColor;

  let initialLCH = chroma(initialColor).lch();
  initialLCH[1] = value;

  let finalColor = chroma.lch(initialLCH);
  el.style.backgroundColor = finalColor.css();

  palette[dataset][index] = finalColor.lch();

  updateColorInChart(luminosityCanva, dataset, index, finalColor.lch()[0], finalColor.hex());
  updateColorInChart(chromaCanva, dataset, index, finalColor.lch()[1], finalColor.hex());
  updateColorInChart(hueCanva, dataset, index, finalColor.lch()[2], finalColor.hex());

  if(index === 0){
    updateColorInChart(contrastCanva, dataset, 0, chroma.contrast('white', finalColor.hex()), finalColor.hex());
    updateColorInChart(contrastCanva, dataset, 1, chroma.contrast(chroma.lch(palette[dataset][0]).hex(), chroma.lch(palette[dataset][1]).hex()), finalColor.hex());
  } else if(index > 0 && index < 9){
    updateColorInChart(contrastCanva, dataset, index, chroma.contrast(chroma.lch(palette[dataset][index - 1]).hex(), finalColor.hex()), finalColor.hex());
    updateColorInChart(contrastCanva, dataset, index + 1, chroma.contrast(chroma.lch(palette[dataset][index + 1]).hex(), finalColor.hex()), finalColor.hex());
  } else if(index === 9){
    updateColorInChart(contrastCanva, dataset, 9, chroma.contrast(chroma.lch(palette[dataset][8]).hex(), finalColor.hex()), finalColor.hex());
    updateColorInChart(contrastCanva, dataset, 10, chroma.contrast('#000000', finalColor.hex()), finalColor.hex());
  }

  updateColorInChart(contrastBlackCanva, dataset, index, chroma.contrast('#000000', finalColor.hex()), finalColor.hex());
  updateColorInChart(contrastWhiteCanva, dataset, index, chroma.contrast('#ffffff', finalColor.hex()), finalColor.hex());
}

function editHue(dataset, index, value){
  let idIndex = index;
  if(index === 0) idIndex = '0.5';

  let id = 'output' + dataset + idIndex;

  let el = document.getElementById(id);
  let initialColor = el.style.backgroundColor;

  let initialLCH = chroma(initialColor).lch();
  initialLCH[2] = value;

  let finalColor = chroma.lch(initialLCH);
  el.style.backgroundColor = finalColor.css();

  palette[dataset][index] = finalColor.lch();

  updateColorInChart(luminosityCanva, dataset, index, finalColor.lch()[0], finalColor.hex());
  updateColorInChart(chromaCanva, dataset, index, finalColor.lch()[1], finalColor.hex());
  updateColorInChart(hueCanva, dataset, index, finalColor.lch()[2], finalColor.hex());

  if(index === 0){
    updateColorInChart(contrastCanva, dataset, 0, chroma.contrast('white', finalColor.hex()), finalColor.hex());
    updateColorInChart(contrastCanva, dataset, 1, chroma.contrast(chroma.lch(palette[dataset][0]).hex(), chroma.lch(palette[dataset][1]).hex()), finalColor.hex());
  } else if(index > 0 && index < 9){
    updateColorInChart(contrastCanva, dataset, index, chroma.contrast(chroma.lch(palette[dataset][index - 1]).hex(), finalColor.hex()), finalColor.hex());
    updateColorInChart(contrastCanva, dataset, index + 1, chroma.contrast(chroma.lch(palette[dataset][index + 1]).hex(), finalColor.hex()), finalColor.hex());
  } else if(index === 9){
    updateColorInChart(contrastCanva, dataset, 9, chroma.contrast(chroma.lch(palette[dataset][8]).hex(), finalColor.hex()), finalColor.hex());
    updateColorInChart(contrastCanva, dataset, 10, chroma.contrast('#000000', finalColor.hex()), finalColor.hex());
  }

  updateColorInChart(contrastBlackCanva, dataset, index, chroma.contrast('#000000', finalColor.hex()), finalColor.hex());
  updateColorInChart(contrastWhiteCanva, dataset, index, chroma.contrast('#ffffff', finalColor.hex()), finalColor.hex());
}

function grayOutLines(chart, datasetIndex){
  chart.data.datasets.forEach((dataset, key) => {
    if(key !== datasetIndex) chart.data.datasets[key].borderColor = 'rgba(173, 173, 173, 0.19)';
    if(key !== datasetIndex) chart.data.datasets[key].pointBackgroundColor = 'rgba(173, 173, 173, 0.19)';
    if(key !== datasetIndex) chart.data.datasets[key].pointBorderColor = 'rgba(173, 173, 173, 0.19)';
  });
}


// Menu Tabs
let menuButtons = Array.from(document.getElementById('menu-buttons').children);
let graphsPage = document.getElementById('graphs');
let codePage = document.getElementById('code');
let contextPage = document.getElementById('context');
let pages = Array.from(document.getElementById('pages').children);

document.getElementById('graphs-btn').addEventListener('click', (e) => {
  menuButtons.forEach((button) => {
    button.classList.remove('border-b-2');
    button.classList.remove('border-blue-500');
    button.classList.remove('text-blue-500');
    button.classList.add('hover:text-gray-800');
    button.classList.remove('cursor-default');
  });

  pages.forEach((page) => { page.classList.add('hidden')});

  e.target.classList.add('border-b-2');
  e.target.classList.add('border-blue-500');
  e.target.classList.add('text-blue-500');
  e.target.classList.remove('hover:text-gray-800');
  e.target.classList.add('cursor-default');

  graphsPage.classList.remove('hidden')
});

document.getElementById('code-btn').addEventListener('click', (e) => {
  menuButtons.forEach((button) => {
    button.classList.remove('border-b-2');
    button.classList.remove('border-blue-500');
    button.classList.remove('text-blue-500');
    button.classList.add('hover:text-gray-800');
    button.classList.remove('cursor-default');
  });

  pages.forEach((page) => { page.classList.add('hidden')});

  e.target.classList.add('border-b-2');
  e.target.classList.add('border-blue-500');
  e.target.classList.add('text-blue-500');
  e.target.classList.remove('hover:text-gray-800');
  e.target.classList.add('cursor-default');

  codePage.classList.remove('hidden')
});

function paintContext(palette)
{
  document.querySelector('.title').style.color =               chroma.lch(palette[0][9]).hex();
  document.querySelector('.subtitle').style.color =            chroma.lch(palette[0][8]).hex();
  document.querySelector('.label').style.color =               chroma.lch(palette[0][7]).hex();
  document.querySelector('.button').style.backgroundColor =    chroma.lch(palette[0][6]).hex();
  document.querySelector('.button').style.color           =    chroma.lch(palette[0][0]).hex();
  document.querySelector('.small-copy').style.color =          chroma.lch(palette[0][7]).hex();
  document.querySelector('.header').style.backgroundColor =    chroma.lch(palette[0][1]).hex();
  document.querySelector('.header').style.color =              chroma.lch(palette[0][7]).hex();
  document.querySelector('.card').style.borderColor =          chroma.lch(palette[0][2]).hex();
  document.querySelector('.context-input').style.borderColor = chroma.lch(palette[0][3]).hex();
  document.querySelector('.context-input').style.backgroundColor = chroma.lch(palette[0][0]).hex();

  document.querySelector('.card-2').style.backgroundColor =                chroma.lch(palette[0][8]).hex();
  document.querySelector('.card-2').style.borderColor =                    chroma.lch(palette[0][5]).hex();
  document.querySelector('.card-2 .button').style.backgroundColor =        chroma.lch(palette[0][4]).hex();
  document.querySelector('.card-2 .button').style.color           =        chroma.lch(palette[0][9]).hex();
  document.querySelector('.card-2 .header').style.backgroundColor =        chroma.lch(palette[0][9]).hex();
  document.querySelector('.card-2 .header').style.color =                  chroma.lch(palette[0][2]).hex();
  document.querySelector('.card-2 .title').style.color =                   chroma.lch(palette[0][0]).hex();
  document.querySelector('.card-2 .subtitle').style.color =                chroma.lch(palette[0][1]).hex();
  document.querySelector('.card-2 .label').style.color =                   chroma.lch(palette[0][1]).hex();
  document.querySelector('.card-2 .small-copy').style.color =              chroma.lch(palette[0][2]).hex();
  document.querySelector('.card-2 .context-input').style.borderColor =     chroma.lch(palette[0][7]).hex();
  document.querySelector('.card-2 .context-input').style.color       =     chroma.lch(palette[0][2]).hex();
  document.querySelector('.card-2 .context-input').style.backgroundColor = chroma.lch(palette[0][9]).hex();

  document.querySelectorAll('.bg-900').forEach(el => el.style.backgroundColor = chroma.lch(palette[0][9]).hex());
  document.querySelectorAll('.bg-800').forEach(el => el.style.backgroundColor = chroma.lch(palette[0][8]).hex());
  document.querySelectorAll('.bg-700').forEach(el => el.style.backgroundColor = chroma.lch(palette[0][7]).hex());
  document.querySelectorAll('.bg-600').forEach(el => el.style.backgroundColor = chroma.lch(palette[0][6]).hex());
  document.querySelectorAll('.bg-500').forEach(el => el.style.backgroundColor = chroma.lch(palette[0][5]).hex());
  document.querySelectorAll('.bg-400').forEach(el => el.style.backgroundColor = chroma.lch(palette[0][4]).hex());
  document.querySelectorAll('.bg-300').forEach(el => el.style.backgroundColor = chroma.lch(palette[0][3]).hex());
  document.querySelectorAll('.bg-200').forEach(el => el.style.backgroundColor = chroma.lch(palette[0][2]).hex());
  document.querySelectorAll('.bg-100').forEach(el => el.style.backgroundColor = chroma.lch(palette[0][1]).hex());
  document.querySelectorAll('.bg-50').forEach(el =>  el.style.backgroundColor = chroma.lch(palette[0][0]).hex());

  document.querySelectorAll('.text-900').forEach(el => el.style.color = chroma.lch(palette[0][9]).hex());
  document.querySelectorAll('.text-800').forEach(el => el.style.color = chroma.lch(palette[0][8]).hex());
  document.querySelectorAll('.text-700').forEach(el => el.style.color = chroma.lch(palette[0][7]).hex());
  document.querySelectorAll('.text-600').forEach(el => el.style.color = chroma.lch(palette[0][6]).hex());
  document.querySelectorAll('.text-500').forEach(el => el.style.color = chroma.lch(palette[0][5]).hex());
  document.querySelectorAll('.text-400').forEach(el => el.style.color = chroma.lch(palette[0][4]).hex());
  document.querySelectorAll('.text-300').forEach(el => el.style.color = chroma.lch(palette[0][3]).hex());
  document.querySelectorAll('.text-200').forEach(el => el.style.color = chroma.lch(palette[0][2]).hex());
  document.querySelectorAll('.text-100').forEach(el => el.style.color = chroma.lch(palette[0][1]).hex());
  document.querySelectorAll('.text-50').forEach(el =>  el.style.color = chroma.lch(palette[0][0]).hex());

  document.querySelector('.white-theme .contrast-black').innerHTML = chroma.contrast('white', 'black');
  document.querySelector('.white-theme .contrast-900').innerHTML   = chroma.contrast('white', chroma.lch(palette[0][9])).toFixed(2);
  document.querySelector('.white-theme .contrast-800').innerHTML   = chroma.contrast('white', chroma.lch(palette[0][8])).toFixed(2);
  document.querySelector('.white-theme .contrast-700').innerHTML   = chroma.contrast('white', chroma.lch(palette[0][7])).toFixed(2);
  document.querySelector('.white-theme .contrast-600').innerHTML   = chroma.contrast('white', chroma.lch(palette[0][6])).toFixed(2);
  document.querySelector('.white-theme .contrast-500').innerHTML   = chroma.contrast('white', chroma.lch(palette[0][5])).toFixed(2);

  let light = chroma.lch(palette[0][0]);
  document.querySelector('.light-theme .contrast-black').innerHTML = chroma.contrast(light, 'black').toFixed(2);
  document.querySelector('.light-theme .contrast-900').innerHTML   = chroma.contrast(light, chroma.lch(palette[0][9])).toFixed(2);
  document.querySelector('.light-theme .contrast-800').innerHTML   = chroma.contrast(light, chroma.lch(palette[0][8])).toFixed(2);
  document.querySelector('.light-theme .contrast-700').innerHTML   = chroma.contrast(light, chroma.lch(palette[0][7])).toFixed(2);
  document.querySelector('.light-theme .contrast-600').innerHTML   = chroma.contrast(light, chroma.lch(palette[0][6])).toFixed(2);
  document.querySelector('.light-theme .contrast-500').innerHTML   = chroma.contrast(light, chroma.lch(palette[0][5])).toFixed(2);

  let lightIi = chroma.lch(palette[0][1]);
  document.querySelector('.light-theme-ii .contrast-black').innerHTML = chroma.contrast(lightIi, 'black').toFixed(2);
  document.querySelector('.light-theme-ii .contrast-900').innerHTML   = chroma.contrast(lightIi, chroma.lch(palette[0][9])).toFixed(2);
  document.querySelector('.light-theme-ii .contrast-800').innerHTML   = chroma.contrast(lightIi, chroma.lch(palette[0][8])).toFixed(2);
  document.querySelector('.light-theme-ii .contrast-700').innerHTML   = chroma.contrast(lightIi, chroma.lch(palette[0][7])).toFixed(2);
  document.querySelector('.light-theme-ii .contrast-600').innerHTML   = chroma.contrast(lightIi, chroma.lch(palette[0][6])).toFixed(2);
  document.querySelector('.light-theme-ii .contrast-500').innerHTML   = chroma.contrast(lightIi, chroma.lch(palette[0][5])).toFixed(2);

  let darkIi = chroma.lch(palette[0][8]);
  document.querySelector('.dark-theme-ii .contrast-white').innerHTML = chroma.contrast(darkIi, 'white').toFixed(2);
  document.querySelector('.dark-theme-ii .contrast-50').innerHTML    = chroma.contrast(darkIi, chroma.lch(palette[0][0])).toFixed(2);
  document.querySelector('.dark-theme-ii .contrast-100').innerHTML   = chroma.contrast(darkIi, chroma.lch(palette[0][1])).toFixed(2);
  document.querySelector('.dark-theme-ii .contrast-200').innerHTML   = chroma.contrast(darkIi, chroma.lch(palette[0][2])).toFixed(2);
  document.querySelector('.dark-theme-ii .contrast-300').innerHTML   = chroma.contrast(darkIi, chroma.lch(palette[0][3])).toFixed(2);
  document.querySelector('.dark-theme-ii .contrast-400').innerHTML   = chroma.contrast(darkIi, chroma.lch(palette[0][4])).toFixed(2);

  let dark = chroma.lch(palette[0][9]);
  document.querySelector('.dark-theme .contrast-white').innerHTML = chroma.contrast(dark, 'white').toFixed(2);
  document.querySelector('.dark-theme .contrast-50').innerHTML    = chroma.contrast(dark, chroma.lch(palette[0][0])).toFixed(2);
  document.querySelector('.dark-theme .contrast-100').innerHTML   = chroma.contrast(dark, chroma.lch(palette[0][1])).toFixed(2);
  document.querySelector('.dark-theme .contrast-200').innerHTML   = chroma.contrast(dark, chroma.lch(palette[0][2])).toFixed(2);
  document.querySelector('.dark-theme .contrast-300').innerHTML   = chroma.contrast(dark, chroma.lch(palette[0][3])).toFixed(2);
  document.querySelector('.dark-theme .contrast-400').innerHTML   = chroma.contrast(dark, chroma.lch(palette[0][4])).toFixed(2);

  document.querySelector('.black-theme .contrast-white').innerHTML = chroma.contrast('black', 'white');
  document.querySelector('.black-theme .contrast-50').innerHTML    = chroma.contrast('black', chroma.lch(palette[0][0])).toFixed(2);
  document.querySelector('.black-theme .contrast-100').innerHTML   = chroma.contrast('black', chroma.lch(palette[0][1])).toFixed(2);
  document.querySelector('.black-theme .contrast-200').innerHTML   = chroma.contrast('black', chroma.lch(palette[0][2])).toFixed(2);
  document.querySelector('.black-theme .contrast-300').innerHTML   = chroma.contrast('black', chroma.lch(palette[0][3])).toFixed(2);
  document.querySelector('.black-theme .contrast-400').innerHTML   = chroma.contrast('black', chroma.lch(palette[0][4])).toFixed(2);
}

document.getElementById('add-color').addEventListener('click', () => {
  let next = nextModel(chroma.lch(palette[palette.length - 1][5]).hex());
  let color1 = shadesModel(rgbToHex(next.r1*255, next.g1*255,next.b1*255));

  palette.push(normalizeFamily(color1));

  //normalizeToLCH(outputs);

  document.getElementById('color-palette').childNodes.forEach((el, key) => {
    el.classList.add('border-white');
  });

  paint(palette);
  renderTexts();
  toCharts();
  pickrButton.setColor(rgbToHex(next.r1*255, next.g1*255,next.b1*255));
});

function deleteFamilyColor(index)
{
  let familySelected = parseInt(document.querySelector('#color-palette .color-row:not(.border-white) .family-swatches').dataset.index);

  palette.splice(index, 1);
  document.getElementById('color-palette').innerHTML = '';

  paint(palette);
  renderTexts();

  // Show all curves if a unique selected color is deleted
  let hidden = hiddenDatasets(luminosityCanva.data.datasets);
  if(!hidden.includes(index) && hidden.length - palette.length === 0) showAllLines();

  // Remove curves from plots
  luminosityCanva.data.datasets.splice(index, 1);
  chromaCanva.data.datasets.splice(index, 1);
  hueCanva.data.datasets.splice(index, 1);
  contrastBlackCanva.data.datasets.splice(index, 1);
  contrastWhiteCanva.data.datasets.splice(index, 1);
  contrastCanva.data.datasets.splice(index, 1);

  luminosityCanva.update();
  chromaCanva.update();
  hueCanva.update();
  contrastWhiteCanva.update();
  contrastBlackCanva.update();
  contrastCanva.update();

  // In case a muted color is deleted and the new palette needs to have same status as before deletion
  luminosityCanva.data.datasets.forEach((colorFamily, key) => {
    if(colorFamily.hidden) document.getElementById('name' + key).classList.remove('bg-yellow-300')
  });

  document.getElementById('color-palette').childNodes.forEach((el, key) => {
    el.classList.add('border-white');
  });

  // Keep selection on family after other deletion
  let newSelected = 0;
  if(index < familySelected) {
    newSelected = familySelected - 1;
    document.getElementById('shade-parent-' + newSelected).classList.remove('border-white');
  } else if(index > familySelected) {
    newSelected = familySelected;
    document.getElementById('shade-parent-' + newSelected).classList.remove('border-white');
  } else {
    newSelected = palette.length - 1;
    document.getElementById('shade-parent-' + newSelected).classList.remove('border-white');
    stopChange = true;
    pickrButton.setColor(chroma.lch(palette[newSelected][5]).hex());
    stopChange = false;
  }
}

document.getElementById('context-btn').addEventListener('click', (e) => {
  paintContext(palette);

  menuButtons.forEach((button) => {
    button.classList.remove('border-b-2');
    button.classList.remove('border-blue-500');
    button.classList.remove('text-blue-500');
    button.classList.add('hover:text-gray-800');
    button.classList.remove('cursor-default');
  });

  pages.forEach((page) => { page.classList.add('hidden')});

  e.target.classList.add('border-b-2');
  e.target.classList.add('border-blue-500');
  e.target.classList.add('text-blue-500');
  e.target.classList.remove('hover:text-gray-800');
  e.target.classList.add('cursor-default');

  contextPage.classList.remove('hidden')
});

function deselectShadesInChart()
{
  let xAxes = [{ticks: {min: '50', max: '900'}}];

  luminosityCanva.options.scales = {
    yAxes: [{
      ticks: {
        max: 100,
        min: 0
      }
    }],
    xAxes: xAxes,
  };

  chromaCanva.options.scales = {
    yAxes: [{
      ticks: {
        max: 110,
        min: 0,
        stepSize: 10
      }
    }],
    xAxes: xAxes,

  };

  hueCanva.options.scales = {
    yAxes: [{
      ticks: {
        max: 360,
        min: 0,
        stepSize: 40
      }
    }],
    xAxes: xAxes,
  };

  luminosityCanva.update();
  chromaCanva.update();
  hueCanva.update();
}

let shadeBtns = document.querySelectorAll('.shade-btn');

shadeBtns.forEach((shadeBtn) => {
  shadeBtn.addEventListener('click', () => {

    if(shadeBtn.classList.contains('bg-blue-300')) {
      deselectShadesInChart();
      shadeBtn.classList.remove('bg-blue-300')
      return;
    }

    shadeBtns.forEach((btn) => {
      btn.classList.remove('bg-blue-300');
    });
    shadeBtn.classList.add('bg-blue-300');

    let index = parseInt(shadeBtn.dataset.value);
    let values = {
      luminosity: [],
      chroma: [],
      hue: []
    };

    palette.forEach((family) => {
      values.luminosity.push(family[index][0]);
      values.chroma.push(family[index][1]);
      values.hue.push(family[index][2]);
      if(index < 9) {
        values.luminosity.push(family[index + 1][0]);
        values.chroma.push(family[index + 1][1]);
        values.hue.push(family[index + 1][2]);
      }
      if(index > 1) {
        values.luminosity.push(family[index - 1][0]);
        values.chroma.push(family[index - 1][1]);
        values.hue.push(family[index - 1][2]);
      }
    });

    let yMax = {
      luminosity: Math.max(...values.luminosity),
      chroma: Math.max(...values.chroma),
      hue: Math.max(...values.hue),
    };
    let yMin = {
      luminosity: Math.min(...values.luminosity),
      chroma: Math.min(...values.chroma),
      hue: Math.min(...values.hue),
    };

    let xMax = index + 1;
    let xMin = index - 1;

    let top = {
      luminosity: Math.ceil(yMax.luminosity/5)*5,
      chroma: Math.ceil(yMax.chroma/5)*5,
      hue: Math.ceil(yMax.hue/50)*50,
    };
    let bottom = {
      luminosity: Math.trunc(yMin.luminosity/5)*5,
      chroma: Math.trunc(yMin.chroma/5)*5,
      hue: Math.trunc(yMin.hue/50)*50,
    };

    if(top.luminosity > 100) top.luminosity = 100;
    if(top.hue > 350) top.hue = 360;

    luminosityCanva.options.scales = {
      yAxes: [{
        ticks: {
          max: top.luminosity,
          min: bottom.luminosity
        }
      }],
      xAxes: [{
        ticks: {
          min: xMin + '00',
          max: xMax + '00'
        }
      }],
    };

    chromaCanva.options.scales = {
      yAxes: [{
        ticks: {
          max: top.chroma,
          min: bottom.chroma
        }
      }],
      xAxes: [{
        ticks: {
          min: xMin + '00',
          max: xMax + '00'
        }
      }],
    };

    hueCanva.options.scales = {
      yAxes: [{
        ticks: {
          max: top.hue,
          min: bottom.hue,
          stepSize: 40
        }
      }],
      xAxes: [{
        ticks: {
          min: xMin + '00',
          max: xMax + '00',
        }
      }],
    };

    luminosityCanva.update();
    chromaCanva.update();
    hueCanva.update();
  });
});

// Copy Button
let clipboard = new ClipboardJS('#copy-btn');

clipboard.on('success', (e) => {
  document.getElementById('copy-btn').innerText = 'Copied';
  e.clearSelection();
  setTimeout(() => {
    document.getElementById('copy-btn').innerText = 'Copy';
  }, 1000)
});