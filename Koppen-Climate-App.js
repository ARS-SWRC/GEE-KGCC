/*******************************************************
  IMPORTS
*/
var ic = ee.ImageCollection('NASA/NEX-DCP30');

var scale = ic.first().projection().nominalScale().getInfo();


/*******************************************************
  DICTIONARIES and LISTS
*/
var scenario_list = ee.List(['rcp26', 'rcp45', 'rcp60', 'rcp85']);
var model_list = ee.List(['ACCESS1-0', 'bcc-csm1-1', 'bcc-csm1-1-m', 'BNU-ESM', 'CanESM2', 'CCSM4', 'CESM1-BGC', 'CESM1-CAM5', 'CMCC-CM', 'CNRM-CM5', 'CSIRO-Mk3-6-0', 'FGOALS-g2', 'FIO-ESM', 'GFDL-CM3', 'GFDL-ESM2G', 'GFDL-ESM2M', 'GISS-E2-H-CC', 'GISS-E2-R', 'GISS-E2-R-CC', 'HadGEM2-AO', 'HadGEM2-CC', 'HadGEM2-ES', 'inmcm4', 'IPSL-CM5A-LR', 'IPSL-CM5A-MR', 'IPSL-CM5B-LR', 'MIROC5', 'MIROC-ESM', 'MIROC-ESM-CHEM', 'MPI-ESM-LR', 'MPI-ESM-MR', 'MRI-CGCM3', 'NorESM1-M']);
var dateRng_list = ee.List(['1970-1999', '1980-2009', '1990-2019', '2000-2029', '2010-2039', '2020-2049', '2030-2059', '2040-2069', '2050-2079', '2060-2089', '2070-2099']);
var class_list = ee.List(['Af', 'Am', 'Aw', 'BWh', 'BWk', 'BSh', 'BSk', 'Csa', 'Csb', 'Csc', 'Cwa', 'Cwb', 'Cwc', 'Cfa', 'Cfb', 'Cfc', 'Dsa', 'Dsb', 'Dsc', 'Dsd', 'Dwa', 'Dwb', 'Dwc', 'Dwd', 'Dfa', 'Dfb', 'Dfc', 'Dfd', 'ET', 'EF']);

var selection_list = ee.List([[2000, 'CCSM4', 'rcp45']]);

var year = ee.Number(ee.List(selection_list.get(0)).get(0));
var model = ee.String('CCSM4');
var scenario = ee.String(ee.List(selection_list.get(0)).get(2));

var class_seq_list = ee.List.sequence(1, 30);
var ndays_months = ee.List([31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
var order_months = ee.List([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

var summr_months = ee.List([4, 5, 6, 7, 8, 9]);
var wintr_months = ee.List([1, 2, 3, 10, 11, 12]);


/*******************************************************
  UI
*/
var typePalette = [
  '#0000FF', '#0078FF', '#46FAAA', '#FF0000', '#FF9696', '#F5A500', '#FFDC64',
  '#FFFF00', '#C8C800', '#969600', '#96FF96', '#64C864', '#329632',
  '#C8FF50', '#64FF50', '#32C800', '#FF00FF', '#C800C8', '#963296', '#966496',
  '#AAAFFF', '#5A78DC', '#4B50B4', '#320087', '#00FFFF', '#37C8FF', '#007D7D', '#00465F',
  '#B2B2B2', '#666666'
];

var visParams = {
  min: 1,
  max: 30,
  palette: typePalette
};

/*******************************************************
  MAIN FUNCTION
*/
var kcModule = require('users/gerardo/default:KOPPEN/Koppen-Climate-MainFunc');


/*******************************************************
  WIDGET SETTINGS (Comparison)
*/
var mainMap = ui.Map(); 
var splitMap = ui.Map(); // for comparison
mainMap.setCenter(-100, 38, 4);  
splitMap.setCenter(-100, 38, 4);

// Selection state for both maps
var scenarioA = {
  year: 2000,
  model: 'CCSM4',
  scenario: 'rcp45'
};
var scenarioB = {
  year: 2000,
  model: 'CCSM4',
  scenario: 'rcp85'
};

function updateMainMap(onCompleteCallback) {
  var im = kcModule.main_fn([scenarioA.year, scenarioA.model, scenarioA.scenario],ic, order_months,ndays_months,summr_months,wintr_months);
  mainMap.layers().reset();
  mainMap.addLayer(im, visParams, 'Scenario A');
  // A cheap server call to trigger the callback when processing is done.
  im.projection().nominalScale().evaluate(function(scale, error) {
    if (error) {
      print('Error during Scenario A map update:', error);
    }
    onCompleteCallback();
  });
}

function updateSplitMap(onCompleteCallback) {
  var im = kcModule.main_fn([scenarioB.year, scenarioB.model, scenarioB.scenario],ic, order_months,ndays_months,summr_months,wintr_months);
  splitMap.layers().reset();
  splitMap.addLayer(im, visParams, 'Scenario B');
  im.projection().nominalScale().evaluate(function(scale, error) {
     if (error) {
       print('Error during Scenario B map update:', error);
     }
    onCompleteCallback();
  });
}

// Initial rendering (with a dummy callback)
updateMainMap(function() {});
updateSplitMap(function() {});


/*******************************************************
  UI PANEL SETUP
*/

// A floating panel to show while the map is loading ---
var loadingOverlay = ui.Panel({
    widgets: [
      ui.Label({
        value: 'Processing...',
        style: {
          fontSize: '24px',
          color: 'white',
          // --- KEY FIX: Make the label's background transparent ---
          backgroundColor: 'rgba(0, 0, 0, 0)'
        }
      })
    ],
    style: {
        position: 'top-center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '20px',
        shown: false, // Start hidden
        border: '1px solid black'
    }
});


// Function to build the info panel content from styled widgets
function createInfoPanelContent() {
  // Helper functions to create styled UI elements
  var makeHeader = function(text) { return ui.Label({value: text, style: {fontWeight: 'bold', fontSize: '20px', margin: '10px 5px'}}); };
  var makeParagraph = function(text) { return ui.Label({value: text, style: {margin: '0 0 8px 8px'}}); };
  var makeDefinitionItem = function(term, definition) { return ui.Panel([ui.Label(term, {fontWeight: 'bold'}), ui.Label(definition)], ui.Panel.Layout.flow('horizontal')); };

  return [
    makeHeader('Overview'),
    makeParagraph('This app is built using the Google Earth Engine cloud platform to do on-the-fly calculation of Köppen-Geiger Climate Classifications (KGCC) and to display outcomes for the Contiguous United States. The default selections are RCP4.5 / CCSM4 / 2000-2029.'),
    makeHeader('Definitions'),
    makeDefinitionItem('KGCC:', 'A climate classification scheme based on seasonal precipitation and temperature.'),
    makeDefinitionItem('CMIP5:', 'An ensemble of Global Climate Models (GCMs) representing standard climate projections.'),
    makeDefinitionItem('NEX-DCP30:', 'A highly downscaled (~800m) monthly climate dataset for the US.'),
    makeHeader('Usage'),
    makeParagraph('There is no consensus on which projection scenario is most likely. However, RCP4.5 is often considered a "middle-ground" scenario. For risk assessment, RCP6.0 can be a plausible "worst-case" scenario. The CCSM4 GCM is recommended as its outcome is typical of the CMIP5 ensemble.'),
    makeHeader('Citations'),
    makeParagraph('• Beck, H. E., et al. (2018). Present and future Köppen-Geiger climate classification maps at 1-km resolution.'),
    makeParagraph('• Peel, M. C., et al. (2007). Updated world map of the Köppen-Geiger climate classification.'),
    makeParagraph('• Thrasher, B., et al. (2013). Downscaled climate projections suitable for resource management.'),
    makeHeader('Additional Notes'),
    makeParagraph('For an in-depth description of each climate type, see wikipedia.org/wiki/Köppen_climate_classification'),
  ];
}

// Info panel that will be shown/hidden.
var infoPanel = ui.Panel({
  widgets: createInfoPanelContent(),
  layout: ui.Panel.Layout.flow('vertical'),
  style: { width: '35%', position: 'top-center', margin: '5% 0 0 0', shown: false, backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid black', padding: '10px' }
});

// Create the legend panel.
var legendPanel = ui.Panel({
  style: { position: 'top-right', padding: '8px 15px', shown: true, backgroundColor: 'rgba(255, 255, 255, 0.85)', border: '1px solid black' }
});
var legendTitle = ui.Label('Köppen-Geiger Classification', {fontWeight: 'bold', fontSize: '14px', margin: '0 0 4px 0', padding: '0'});
legendPanel.add(legendTitle);
var typeLabels = [
  'Af - Tropical, Rainforest', 'Am - Tropical, Monsoon', 'Aw - Tropical, Savanna', 'Bwh - Arid, Desert, Hot', 'Bwk - Arid, Desert, Cold', 'Bsh - Semi-Arid, Steppe, Hot', 'Bsk - Semi-Arid, Steppe, Cold',
  'Csa - Temperate, Dry Summer, Hot Summer', 'Csb - Temperate, Dry Summer, Warm Summer', 'Csc - Temperate, Dry Summer, Cold Summer', 'Cwa - Temperate, Dry Winter, Hot Summer', 'Cwb - Temperate, Dry Winter, Warm Summer', 'Cwc - Temperate, Dry Winter, Cold Summer',
  'Cfa - Temperate, No Dry Season, Hot Summer', 'Cfb - Temperate, No Dry Season, Warm Summer', 'Cfc - Temperate, No Dry Season, Cold Summer', 'Dsa - Cold, Dry Summer, Hot Summer', 'Dsb - Cold, Dry Summer, Warm Summer', 'Dsc - Cold, Dry Summer, Cold Summer', 'Dsd - Cold, Dry Summer, Very Cold Winter',
  'Dwa - Cold, Dry Winter, Hot Summer', 'Dwb - Cold, Dry Winter, Warm Summer', 'Dwc - Cold, Dry Winter, Cold Summer', 'Dwd - Cold, Dry Winter, Very Cold Winter', 'Dfa - Cold, No Dry Season, Hot Summer', 'Dfb - Cold, No Dry Season, Warm summer', 'Dfc - Cold, No Dry season, Cold Summer', 'Dfd - Cold, No Dry Season, Very Cold Winter',
  'Et - Polar Tundra', 'Ef - Polar Ice Cap'
];
var makeLegendRow = function(color, name) {
  var colorBox = ui.Label({style: {backgroundColor: color, padding: '8px', margin: '0 0 4px 0'}});
  var description = ui.Label({value: name, style: {margin: '0 0 4px 6px'}});
  return ui.Panel({widgets: [colorBox, description], layout: ui.Panel.Layout.Flow('horizontal')});
};
for (var i = 0; i < typeLabels.length; i++) { legendPanel.add(makeLegendRow(typePalette[i], typeLabels[i])); }

// --- Create all the control widgets ---

// MODIFIED: All dropdowns now show the loading overlay and use the callback.
var hideLoading = function() { loadingOverlay.style().set('shown', false); };

var scenarioADrop = ui.Select({
  items: scenario_list.getInfo(),
  value: scenarioA.scenario,
  onChange: function(val) {
    loadingOverlay.style().set('shown', true);
    scenarioA.scenario = val;
    updateMainMap(hideLoading);
  },
  style: {stretch: 'horizontal'}
});

var modelADrop = ui.Select({
  items: model_list.getInfo(),
  value: scenarioA.model,
  onChange: function(val) {
    loadingOverlay.style().set('shown', true);
    scenarioA.model = val;
    updateMainMap(hideLoading);
  },
  style: {stretch: 'horizontal'}
});

var dateADrop = ui.Select({
  items: dateRng_list.getInfo(),
  value: '2000-2029',
  onChange: function(val) {
    loadingOverlay.style().set('shown', true);
    scenarioA.year = parseInt(val.split('-')[0]);
    updateMainMap(hideLoading);
  },
  style: {stretch: 'horizontal'}
});

var scenarioBDrop = ui.Select({
  items: scenario_list.getInfo(),
  value: scenarioB.scenario,
  onChange: function(val) {
    loadingOverlay.style().set('shown', true);
    scenarioB.scenario = val;
    updateSplitMap(hideLoading);
  },
  style: {stretch: 'horizontal'}
});

var modelBDrop = ui.Select({
  items: model_list.getInfo(),
  value: scenarioB.model,
  onChange: function(val) {
    loadingOverlay.style().set('shown', true);
    scenarioB.model = val;
    updateSplitMap(hideLoading);
  },
  style: {stretch: 'horizontal'}
});

var dateBDrop = ui.Select({
  items: dateRng_list.getInfo(),
  value: '2000-2029',
  onChange: function(val) {
    loadingOverlay.style().set('shown', true);
    scenarioB.year = parseInt(val.split('-')[0]);
    updateSplitMap(hideLoading);
  },
  style: {stretch: 'horizontal'}
});

// Other control widgets
var infoCheckbox = ui.Checkbox({ label: 'Show/Hide App Information', value: false, onChange: function(checked) { infoPanel.style().set('shown', checked); } });
var legendCheckbox = ui.Checkbox({ label: 'Show/Hide Legend', value: true, onChange: function(checked) { legendPanel.style().set('shown', checked); } });
var basemapSelect = ui.Select({ items: ['roadmap', 'satellite', 'terrain', 'hybrid'], value: 'roadmap', onChange: function(value) { mainMap.setOptions(value); splitMap.setOptions(value); }, style: {stretch: 'horizontal'} });
var compareCheckbox = ui.Checkbox({ label: 'Compare scenarios', value: false });

// Assemble control panels
var controlPanelA = ui.Panel({
  widgets: [
    infoCheckbox, legendCheckbox,
    ui.Label('Basemap Selection', {fontWeight: 'bold', margin: '8px 0 0 0'}),
    basemapSelect,
    ui.Label('Scenario A', {fontWeight: 'bold', margin: '8px 0 0 0'}),
    ui.Label('Emissions Scenario:'), scenarioADrop,
    ui.Label('GCM Model:'), modelADrop,
    ui.Label('Date Range:'), dateADrop,
  ],
  style: {stretch: 'vertical'}
});

var controlPanelB = ui.Panel({
  widgets: [
    ui.Label('Scenario B', {fontWeight: 'bold', margin: '8px 0 0 0'}),
    ui.Label('Emissions Scenario:'), scenarioBDrop,
    ui.Label('GCM Model:'), modelBDrop,
    ui.Label('Date Range:'), dateBDrop
  ],
  style: {stretch: 'vertical', shown: false}
});

var mainControlPanel = ui.Panel({ widgets: [controlPanelA, compareCheckbox, controlPanelB], style: {width: '300px', padding: '8px'} });

// Assemble main layout
var linker = ui.Map.Linker([mainMap, splitMap]);
var splitPanel = ui.SplitPanel({ firstPanel: mainMap, secondPanel: splitMap, wipe: true, style: {stretch: 'both'} });
var masterPanel = ui.Panel({ widgets: [mainControlPanel, mainMap], layout: ui.Panel.Layout.flow('horizontal'), style: {stretch: 'both'} });

// Set up logic for comparison checkbox
compareCheckbox.onChange(function(checked) {
  controlPanelB.style().set('shown', checked);
  masterPanel.widgets().set(1, checked ? splitPanel : mainMap);
});

/*******************************************************
  FINAL UI LAYOUT SETUP
*/
ui.root.setLayout(ui.Panel.Layout.absolute());
ui.root.clear();
ui.root.add(masterPanel);
ui.root.add(infoPanel);
ui.root.add(legendPanel);
ui.root.add(loadingOverlay); // Add the loading panel to the root so it can float over everything