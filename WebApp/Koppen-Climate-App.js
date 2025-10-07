/*******************************************************
  IMPORTS
*/
var ic = ee.ImageCollection('NASA/NEX-DCP30');
var scale = ic.first().projection().nominalScale().getInfo();
var proj = ic.first().projection();

/*******************************************************
  DICTIONARIES and LISTS
*/
var scenarioModelDict = {
  'rcp26': ['bcc-csm1-1','BNU-ESM','CanESM2','CCSM4','CESM1-CAM5','CSIRO-Mk3-6-0','FGOALS-g2','FIO-ESM','GFDL-CM3','GFDL-ESM2G','GFDL-ESM2M','GISS-E2-R','HadGEM2-AO','HadGEM2-ES','IPSL-CM5A-LR','IPSL-CM5A-MR','MIROC5','MIROC-ESM','MIROC-ESM-CHEM','MPI-ESM-LR','MPI-ESM-MR','MRI-CGCM3','NorESM1-M'],
  'rcp45': ['ACCESS1-0','bcc-csm1-1','bcc-csm1-1-m','BNU-ESM','CanESM2','CCSM4','CESM1-BGC','CESM1-CAM5','CMCC-CM','CNRM-CM5','CSIRO-Mk3-6-0','FGOALS-g2','FIO-ESM','GFDL-CM3','GFDL-ESM2G','GFDL-ESM2M','GISS-E2-H-CC','GISS-E2-R','GISS-E2-R-CC','HadGEM2-AO','HadGEM2-CC','HadGEM2-ES','inmcm4','IPSL-CM5A-LR','IPSL-CM5A-MR','IPSL-CM5B-LR','MIROC5','MIROC-ESM','MIROC-ESM-CHEM','MPI-ESM-LR','MPI-ESM-MR','MRI-CGCM3','NorESM1-M'],
  'rcp60': ['bcc-csm1-1','CCSM4','CESM1-CAM5','CSIRO-Mk3-6-0','FIO-ESM','GFDL-CM3','GFDL-ESM2G','GFDL-ESM2M','GISS-E2-R','HadGEM2-AO','HadGEM2-ES','IPSL-CM5A-LR','IPSL-CM5A-MR','MIROC5','MIROC-ESM','MIROC-ESM-CHEM','NorESM1-M'],
  'rcp85': ['ACCESS1-0','bcc-csm1-1','bcc-csm1-1-m','BNU-ESM','CanESM2','CCSM4','CESM1-BGC','CESM1-CAM5','CMCC-CM','CNRM-CM5','CSIRO-Mk3-6-0','FGOALS-g2','FIO-ESM','GFDL-CM3','GFDL-ESM2G','GFDL-ESM2M','GISS-E2-R','HadGEM2-AO','HadGEM2-CC','HadGEM2-ES','inmcm4','IPSL-CM5A-LR','IPSL-CM5A-MR','IPSL-CM5B-LR','MIROC5','MIROC-ESM','MIROC-ESM-CHEM','MPI-ESM-LR','MPI-ESM-MR','MRI-CGCM3','NorESM1-M']
};
var scenario_list = Object.keys(scenarioModelDict);

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
  MAIN FUNCTION
*/
var kcModule = require('users/gerardo/default:KOPPEN/Koppen-Climate-MainFunc');

/*******************************************************
  UI
*/
/*******************************************************
  Styles
*/
var typePalette = [
  '#0000FF', '#0078FF', '#46AAFA', '#FF0000', '#FF9696', '#F5A500', '#FFDC64',
  '#FFFF00', '#C8C800', '#969600', '#96FF96', '#64C864', '#329632',
  '#C8FF50', '#64FF50', '#32C800', '#FF00FF', '#C800C8', '#963296', '#966496',
  '#AAAFFF', '#5A78DC', '#4B50B4', '#320087', '#00FFFF', '#37C8FF', '#007D7D', '#00465F',
  '#B2B2B2', '#666666'];

var visParams = {
  min:1,
  max:30,
  palette:typePalette};

//https://eltos.github.io/gradient/#0:000000-5:FF0000-50:D7481D-90:59F720-95:800080
var uncertGrad = 
  '<RasterSymbolizer>' + 
    '<ColorMap type="ramp">' + 
      '<ColorMapEntry quantity="0" color="#000000"/>' + 
      '<ColorMapEntry quantity="10" color="#FF0000"/>' +
      '<ColorMapEntry quantity="50" color="#D7481D"/>' +
      '<ColorMapEntry quantity="90" color="#59F720"/>' +
      '<ColorMapEntry quantity="100" color="#800080"/>' +
    '</ColorMap>' +
  '</RasterSymbolizer>';

var clrgradVis = {
  bbox:'0,0,10,100', 
  dimensions:'50x200'};

var loadinglabelStyle = {
  fontSize:'24px',
  color:'white',
  // --- KEY FIX: Make the label's background transparent ---
  backgroundColor:'rgba(0, 0, 0, 0)'};

var loadingpanelStyle = {
  position:'top-center',
  backgroundColor:'rgba(0,0,0,0.7)',
  padding:'20px',
  shown:false, // Start hidden
  border:'1px solid black'};

var headerlabelStyle = {
  fontWeight:'bold', 
  fontSize:'20px', 
  margin:'10px 5px'};

var paragraphlabelStyle = {margin:'0 0 8px 8px'};

var termlabelStyle = {fontWeight:'bold'};

var infopanelStyle = {
  width:'35%', 
  position:'top-center', 
  margin:'5% 0 0 0', 
  shown:false, 
  backgroundColor:'rgba(255, 255, 255, 0.95)',
  border:'1px solid black',
  padding:'10px'};

var legendpanelStyle = { 
  position:'top-right', 
  padding:'8px 15px', 
  margin:'75px 0 0 0', 
  shown:true, 
  backgroundColor:'rgba(255, 255, 255, 0.85)',
  border:'1px solid black'};

var legendlabelStyle = {
  fontWeight:'bold', 
  fontSize:'14px',
  margin:'0 0 4px 0', 
  padding:'0'};

var colorlabelStyle = {
  backgroundColor:null, 
  padding:'8px', 
  margin:'0 0 4px 0'};

var classlabelStyle = {margin:'0 0 4px 6px'};

var dropStyle = {stretch:'horizontal'};

var timelineboxStyle = {
  position:'top-left', 
  fontSize:'14px'};

var loadingtimelinepanelStyle = {
  position:'top-center',
  backgroundColor:'rgba(255,255,255,0.9)',
  padding:'12px',
  border:'1px solid black',
  shown:false};

var loadingtimelinelabelStyle = {
  fontWeight:'bold',
  fontSize:'20px',
  color:'black',
  textAlign:'center'};

var timelinepanelStyle = {
  position:'top-center', 
  stretch:'vertical', 
  height:'390px', 
  width:'370px', 
  margin:'10px 10px'};

var timelinetitlelabelStyle = {
  padding:'1px',
  margin:'0px 10px 0px 10px',
  position:'top-center',
  fontSize:'20px', 
  fontWeight:'bold'};

var timelinesubtitlelabelStyle = {
  padding:'1px',
  margin:'0px 10px 20px 90px',
  position:'top-center',
  fontSize:'13px'};

var timelinecolorlabelStyle = {
  backgroundColor:null,
  padding:'6px',
  margin:'0px 0px 5px ',
  border:'1px solid black',
  position:'middle-right',
  fontSize:'20px'};

var datelabelStyle = {
  padding:'1px',
  margin:'0px 10px 0px 80px',
  position:'middle-right',
  fontSize:'20px'};

var timelinetypelabelStyle = {
  padding:'1px',
  margin:'0px',
  position:'middle-right',
  fontSize:'20px'};

var dropheaderlabelStyle = {
  fontWeight:'bold', 
  margin: '8px 0 0 0'};

var compareApanelStyle = {stretch:'vertical'};

var compareBpanelStyle = {
  stretch:'vertical', 
  shown: false};

var clrgradlabelStyle = {
  fontWeight:'bold', 
  fontSize:'16px',
  margin:'0 0 4px 0',
  padding:'0'};

var clrgradpanelStyle = {width:'100px',
 height:'300px',
 position:'bottom-left', 
 padding:'8px 15px'};

var clrgradthumbStyle = {
  position:'bottom-right', 
  stretch:'vertical', 
  margin:'0px 8px', 
  maxHeight:'200px'};

var pixellabelStyle = {
  height:'80px',
  width:'80px',
  padding:'0px',
  margin:'0px',
  position:'top-center',
  fontSize:'16px',
  fontWeight: 'bold'};

var pixelpanelStyle = {
  height:'100px',
  width:'100px',
  position:'bottom-center',
  margin:'1px 1px'};

var mainpanelStyle = {
  width:'300px', 
  padding:'8px'};

var splitpanelStyle = {stretch:'both'};


/*******************************************************
  WIDGET SETTINGS (Comparison)
*/
var mainMap = ui.Map(); 
var splitMap = ui.Map(); // for comparison
mainMap.setCenter(-100, 38, 4);  
splitMap.setCenter(-100, 38, 4);

// Selection state for both maps
var scenarioA = {
  year:2000,
  model:'CCSM4',
  scenario:'rcp45'};

var scenarioB = {
  year:2000,
  model:'CCSM4',
  scenario:'rcp85'};

function updateMainMap(onCompleteCallback){
  var im = kcModule.main_fn([scenarioA.year, scenarioA.model, scenarioA.scenario],ic, order_months,ndays_months,summr_months,wintr_months);
  mainMap.layers().reset();
  mainMap.widgets().reset();
  mainMap.addLayer(im, visParams, 'Scenario A');
  // A cheap server call to trigger the callback when processing is done.
  im.projection().nominalScale().evaluate(function(scale, error){
    if (error){
      print('Error during Scenario A map update:', error);
    }
    onCompleteCallback();
  });
}

function updateSplitMap(onCompleteCallback){
  var im = kcModule.main_fn([scenarioB.year, scenarioB.model, scenarioB.scenario],ic, order_months,ndays_months,summr_months,wintr_months);
  splitMap.layers().reset();
  splitMap.widgets().reset();
  splitMap.addLayer(im, visParams, 'Scenario B');
  im.projection().nominalScale().evaluate(function(scale, error){
     if (error){
       print('Error during Scenario B map update:', error);
     }
    onCompleteCallback();
  });
}

// Initial rendering (with a dummy callback)
updateMainMap(function(){});
updateSplitMap(function(){});


/*******************************************************
  UI PANEL SETUP
*/

// A floating panel to show while the map is loading ---
var loadingOverlay = ui.Panel({
  widgets:[ui.Label({value: 'Processing...', style:loadinglabelStyle})],
  style:loadingpanelStyle});

// Function to build the info panel content from styled widgets
function createInfoPanelContent(){
  // Helper functions to create styled UI elements
  var makeHeader = function(text) {return ui.Label({value:text, style:headerlabelStyle});};
  var makeParagraph = function(text) {return ui.Label({value:text, style:paragraphlabelStyle});};
  var makeDefinitionItem = function(term, definition) { return ui.Panel([ui.Label(term, termlabelStyle), ui.Label(definition)], ui.Panel.Layout.flow('horizontal')); };
  
  return [
    makeHeader('Overview'),
    makeParagraph('This app is built using the Google Earth Engine cloud platform to do on-the-fly calculation of Köppen-Geiger Climate Classifications (KGCC) and to display outcomes for the Contiguous United States. The applied climate dataset is NEX-DCP30 (Trasher, 2013).'),
    makeHeader('Definitions'),
    makeDefinitionItem('KGCC:', 'A climate classification scheme based on seasonal precipitation and temperature.'),
    makeDefinitionItem('CMIP5:', 'An ensemble of Global Climate Models (GCMs) representing standard climate projections.'),
    makeDefinitionItem('NEX-DCP30:', 'A highly downscaled (~800m) monthly climate dataset for the US.'),
    makeHeader('Usage'),
    makeParagraph('There is no consensus on which projection scenario is most likely. However, RCP4.5 is often considered a "middle-ground" scenario. For risk assessment, RCP6.0 is a plausible "worst-case" scenario, while RCP8.5 is an extreme scenario that is considered less plausible. The CCSM4 GCM is recommended when considering only a single GCM because the CCSM4 outcome is typical of the CMIP5 ensemble. Note that not all GCMs are available for each emissions scenario. Therefore, class uncertainties that consider % of ensemble agreement have different total GCM counts depending on the scenario. RCP2.6 has 23, RCP4.5 has 33, RCP6.0 has 17, RCP8.5 has 31'),
    makeHeader('Citations'),
    makeParagraph('• Beck, H. E., et al. (2018). Present and future Köppen-Geiger climate classification maps at 1-km resolution.'),
    makeParagraph('• Peel, M. C., et al. (2007). Updated world map of the Köppen-Geiger climate classification.'),
    makeParagraph('• Thrasher, B., et al. (2013). Downscaled climate projections suitable for resource management.'),
    makeHeader('Additional Notes'),
    makeParagraph('For an in-depth description of each climate type, see wikipedia.org/wiki/Köppen_climate_classification'),
    makeParagraph('The codebase for this project is available at https://github.com/ARS-SWRC/GEE-KGCC'),
  ];
}

// Info panel that will be shown/hidden.
var infoPanel = ui.Panel({
  widgets:createInfoPanelContent(),
  layout:ui.Panel.Layout.flow('vertical'),
  style:infopanelStyle});

// Create the legend panel.
var legendPanel = ui.Panel({style:legendpanelStyle});
var legendTitle = ui.Label({value:'Köppen-Geiger Classification', style:legendlabelStyle});
legendPanel.add(legendTitle);
var typeLabels = [
  'Af - Tropical, Rainforest', 'Am - Tropical, Monsoon', 'Aw - Tropical, Savanna', 'Bwh - Arid, Desert, Hot', 'Bwk - Arid, Desert, Cold', 'Bsh - Semi-Arid, Steppe, Hot', 'Bsk - Semi-Arid, Steppe, Cold',
  'Csa - Temperate, Dry Summer, Hot Summer', 'Csb - Temperate, Dry Summer, Warm Summer', 'Csc - Temperate, Dry Summer, Cold Summer', 'Cwa - Temperate, Dry Winter, Hot Summer', 'Cwb - Temperate, Dry Winter, Warm Summer', 'Cwc - Temperate, Dry Winter, Cold Summer',
  'Cfa - Temperate, No Dry Season, Hot Summer', 'Cfb - Temperate, No Dry Season, Warm Summer', 'Cfc - Temperate, No Dry Season, Cold Summer', 'Dsa - Cold, Dry Summer, Hot Summer', 'Dsb - Cold, Dry Summer, Warm Summer', 'Dsc - Cold, Dry Summer, Cold Summer', 'Dsd - Cold, Dry Summer, Very Cold Winter',
  'Dwa - Cold, Dry Winter, Hot Summer', 'Dwb - Cold, Dry Winter, Warm Summer', 'Dwc - Cold, Dry Winter, Cold Summer', 'Dwd - Cold, Dry Winter, Very Cold Winter', 'Dfa - Cold, No Dry Season, Hot Summer', 'Dfb - Cold, No Dry Season, Warm summer', 'Dfc - Cold, No Dry season, Cold Summer', 'Dfd - Cold, No Dry Season, Very Cold Winter',
  'Et - Polar Tundra', 'Ef - Polar Ice Cap'];
  
var makeLegendRow = function(color, name){
  var labelStyle = colorlabelStyle;
  labelStyle.backgroundColor = color;
  var colorBox = ui.Label({style:labelStyle});
  var description = ui.Label({value:name, style:classlabelStyle});
  return ui.Panel({widgets: [colorBox, description], layout: ui.Panel.Layout.Flow('horizontal')});
};

for (var i = 0; i < typeLabels.length; i++) {legendPanel.add(makeLegendRow(typePalette[i], typeLabels[i]));}

// --- Create all the control widgets ---

// Uncertainty dropdown should be moved here
var hideLoading = function() {loadingOverlay.style().set('shown', false);};

var scenarioADrop = ui.Select({
  items:scenario_list,
  value:scenarioA.scenario,
  onChange:function(val){
    loadingOverlay.style().set('shown', true);
    scenarioA.scenario = val;
    // Dynamically update model list
    var models = scenarioModelDict[val];
    modelADrop.items().reset(models);
    // Reset current model to first in new list
    scenarioA.model = models[0];
    modelADrop.setValue(models[0], false);
    updateMainMap(hideLoading);},
  style:dropStyle});

var modelADrop = ui.Select({
  items:scenarioModelDict[scenarioA.scenario],
  value:scenarioA.model,
  onChange:function(val){
    loadingOverlay.style().set('shown', true);
    scenarioA.model = val;
    updateMainMap(hideLoading);},
  style:dropStyle});
  
modelADrop.items().reset(scenarioModelDict[scenarioA.scenario]); // set initial model list value

var dateADrop = ui.Select({
  items:dateRng_list.getInfo(),
  value:'2000-2029',
  onChange:function(val){
    loadingOverlay.style().set('shown', true);
    scenarioA.year = parseInt(val.split('-')[0]);
    updateMainMap(hideLoading);},
  style:dropStyle});

var scenarioBDrop = ui.Select({
  items:scenario_list,
  value:scenarioB.scenario,
  onChange:function(val){
    loadingOverlay.style().set('shown', true);
    scenarioB.scenario = val;
    var models = scenarioModelDict[val];
    modelBDrop.items().reset(models);
    scenarioB.model = models[0];
    modelBDrop.setValue(models[0], false);
    updateSplitMap(hideLoading);},
  style:dropStyle});

var modelBDrop = ui.Select({
  items:scenarioModelDict[scenarioB.scenario],
  value:scenarioB.model,
  onChange:function(val){
    loadingOverlay.style().set('shown', true);
    scenarioB.model = val;
    updateSplitMap(hideLoading);},
  style:dropStyle});

modelBDrop.items().reset(scenarioModelDict[scenarioB.scenario]); // set initial model list value

var dateBDrop = ui.Select({
  items:dateRng_list.getInfo(),
  value:'2000-2029',
  onChange:function(val){
    loadingOverlay.style().set('shown', true);
    scenarioB.year = parseInt(val.split('-')[0]);
    updateSplitMap(hideLoading);},
  style:dropStyle});

// Other control widgets
var appTitle = ui.Label({value:'Köppen Climate Viewer', style:{ position:'bottom-center', whiteSpace:'preserve nowrap', padding:'0px 0px', margin:'2px', textAlign:'left', fontSize:'20px', fontWeight:'bold' }});
var appSubTitle = ui.Label({value:'Köppen-Geiger Climate Classifications Viewer (NEX-DCP30 dataset)', style:{ position:'bottom-center', whiteSpace:'preserve nowrap', padding:'0px 0px', margin:'1px 2px 10px 2px', textAlign:'left', fontSize:'12px', width: '230px',whiteSpace: 'normal' }});
var infoCheckbox = ui.Checkbox({label:'Show/Hide App Information', value:false, onChange:function(checked) {infoPanel.style().set('shown', checked);}});
var legendCheckbox = ui.Checkbox({label:'Show/Hide Legend', value:true, onChange:function(checked) {legendPanel.style().set('shown', checked);}});
var uncertSelect = ui.Select({items:class_list.getInfo(), placeholder:'Select Uncertainty', onChange:renderUncertainty, style:dropStyle});
var compareCheckbox = ui.Checkbox({label:'Compare Scenarios', onChange:createCompareSplitUI, value:false});
var timelineCheckbox = ui.Checkbox({label:'Timeline On Click', onChange:renderTimelinebox, style:timelineboxStyle});
var inspectCheckbox = ui.Checkbox({label:'Pixel Value On Click', onChange:renderPixelInspector});

/*******************************************************
  POP-UP TIMELINE LOGIC
*/

// globals for timeseries functionality
var timelinePanel = ui.Panel({style:timelinepanelStyle});

// timeline loading message
var timelineLoadingPanel = ui.Panel({
  widgets:[ui.Label({value:'Loading ...', style:loadingtimelinelabelStyle})],
  style:loadingtimelinepanelStyle});

function renderTimelineboxCallback(clickInfo_obj){

  timelineLoadingPanel.style().set('shown', true); // show loading panel immediately
  timelinePanel.style().set('shown', false);
  
  // Use setTimeout to let the UI update first
  ui.util.setTimeout(function(){

    timelinePanel = ui.Panel({style:timelinepanelStyle});
  
    var lat = clickInfo_obj.lat;
    var lon = clickInfo_obj.lon;
    var pt = ee.Geometry.Point([lon, lat]);

    function click_zipper_fn(date_obj){
      var d = ee.Number.parse(ee.String(date_obj).split('-').get(0));
      return ee.List([d, scenarioA.model, scenarioA.scenario]);
    }

    var click_selection_list = ee.List(dateRng_list.map(click_zipper_fn));

    function main_fn_wrapper(triple){
      return kcModule.main_fn(triple, ic, order_months, ndays_months, summr_months, wintr_months);
    }

    var click_ic = ee.ImageCollection(click_selection_list.map(main_fn_wrapper));

    var prop_sample_list = click_ic.getRegion({geometry:pt, scale:scale}).getInfo();

    var js_type_list = [];
    for (var i = 1; i < prop_sample_list.length; i++){
      var type_str = class_list.get(prop_sample_list[i][4] - 1).getInfo();
      js_type_list.push(type_str);
    }

    var typelabel_list = [];
    var daterng_list = [];
    for (var i = 0; i < js_type_list.length; i++){
      var type = js_type_list[i];
      var date = dateRng_list.getInfo()[i];
      typelabel_list.push(type);
      daterng_list.push(date);
    }

    var titlelabel = ui.Label({
      value:"Timeline of Köppen-Geiger Classes",
      style:timelinetitlelabelStyle});
        
    var subTitlelabel = ui.Label({
      value:"(for the selected point)",
      style:timelinesubtitlelabelStyle});
      
    var row = ui.Panel({
      widgets: [titlelabel,subTitlelabel],
      layout: ui.Panel.Layout.Flow('vertical')});
  
    timelinePanel.add(row);
    for (var i = 0; i < js_type_list.length; i++){
      var type_index = class_list.indexOf(ee.String(js_type_list[i])).getInfo();
      var colorboxStyle = timelinecolorlabelStyle;
      colorboxStyle.backgroundColor = typePalette[type_index];
      var colorBox = ui.Label({style:colorboxStyle});
      var datelabel = ui.Label({value:daterng_list[i], style:datelabelStyle});
      var typelabel = ui.Label({value:typelabel_list[i], style:timelinetypelabelStyle});
      var row = ui.Panel({widgets:[datelabel, colorBox, typelabel], layout:ui.Panel.Layout.Flow('horizontal')});
      timelinePanel.add(row);
    }
    ui.root.add(timelinePanel);
    timelinePanel.style().set('shown', true);
    
    timelineLoadingPanel.style().set('shown', false); // hide loading panel after done
  }, 100); // Delay allows UI to show loading indicator
}

function renderTimelinebox(bool_obj){
  if (bool_obj === true){
    mainMap.style().set('cursor', 'crosshair'); 
    mainMap.onClick(renderTimelineboxCallback);
  }
  else{
    mainMap.unlisten();
    mainMap.style().set('cursor', 'hand'); 
    ui.root.remove(timelinePanel);
    timelinePanel = ui.Panel({style:timelinepanelStyle});
  }
}


/*******************************************************
  PIXEL VALUE ON CLICK
*/

//PRINT RGB VALUES FOR UNCERTAINTY VALUE LOOK-UP
// function hex2rgb(hex){
//   var cleanHex = hex.slice(1);
//   var r = parseInt(cleanHex.substring(0, 2), 16);
//   var g = parseInt(cleanHex.substring(2, 4), 16);
//   var b = parseInt(cleanHex.substring(4, 6), 16);
//   return [r, g, b];
// }
// print(hex2rgb('#000000'));
// print(hex2rgb('#FF0000'));
// print(hex2rgb('#D7481D'));
// print(hex2rgb('#59F720'));
// print(hex2rgb('#800080'));

function rgb2value(r, g, b){
  //the band with the biggest difference is used
  //#value of zero
  if (r + b + g === 0){
    var perc = 0.0;
    return perc;
  }
  //value between 0% and 10%
  if (g === 0 && b === 0){
    var frac = r/255.0;
    var perc = frac*10.0;
    return perc
  }
  //value between 10% and 50%
  if (b < 29.0){
    var frac = g/72.0;
    var perc = (frac*40.0) + 10.0;
    return perc;
  }
  //value between 50% and 90%
  if (b < 32){
    var frac = (175.0 - (247.0 - g))/175.0;
    var perc = (frac*40.0) + 50.0;
    return perc;
  }
  //value between 90% and 100%
  if (b >= 32){
    var frac = (247.0 - g)/247.0;
    var perc = (frac*10.0) + 90.0;
    return perc;
  }
  //value of 100%
  if (r == 128 && g === 0 && b == 128){
    var perc = 100.0;
    return perc;
  }
}

var pixel_panel = ui.Panel({style:pixelpanelStyle});

function makepixelLabel(point_geo){
  var im_to_sample = mainMap.layers().get(0).get("eeObject");
  var point_fc = im_to_sample.sample(point_geo, scale, proj);
  var prop_ft = point_fc.first();
  var prop_names = prop_ft.propertyNames();
  if (prop_names.getInfo().length < 3){
    var sys_index_idx = prop_names.getInfo().indexOf('system:index');
    var prop_idx = 1 - sys_index_idx;
    var prop_val = ee.Number(prop_ft.get(prop_names.get(prop_idx)));
    var prop_val = class_list.get(prop_val.subtract(1));
    var pixel_label = ui.Label({
      value:'Pixel Value:'.concat('\n').concat(prop_val.getInfo()),
      style:pixellabelStyle
    });
    return pixel_label;
  }else{
    var r_val = prop_ft.get('vis-red').getInfo();
    var g_val = prop_ft.get('vis-green').getInfo();
    var b_val = prop_ft.get('vis-blue').getInfo();
    var prop_val = rgb2value(r_val, g_val, b_val).toFixed(1);
    var pixel_label = ui.Label({
      value:'Pixel Value:'.concat('\n').concat(prop_val).concat('%'),
      style:pixellabelStyle
    });
    return pixel_label;
  }
}

function renderPixelInspectorCallback(clickInfo_obj){
  
  timelineLoadingPanel.style().set('shown', true); // show loading panel immediately
  pixel_panel.style().set('shown', false);
  
  // Use setTimeout to let the UI update first
  ui.util.setTimeout(function(){
    mainMap.remove(pixel_panel);
    var lat = clickInfo_obj.lat;
    var lon = clickInfo_obj.lon;
    var pt = ee.Geometry.Point([lon, lat]);
    
    var pixel_label = makepixelLabel(pt);
    pixel_panel = ui.Panel({
      widgets:pixel_label,
      layout:ui.Panel.Layout.Flow('horizontal'),
      style:pixelpanelStyle
    });
    
    mainMap.add(pixel_panel);
    timelineLoadingPanel.style().set('shown', false);
    pixel_panel.style().set('shown', true);
  }, 100); // Delay allows UI to show loading indicator
}

function renderPixelInspector(checkbox_bool){
  if (checkbox_bool === true){
    mainMap.style().set('cursor', 'crosshair');
    mainMap.onClick(renderPixelInspectorCallback);
  }
  else{
    mainMap.style().set('cursor', 'hand');
    mainMap.unlisten();
    mainMap.remove(pixel_panel);
    pixel_panel = ui.Panel({style:pixelpanelStyle});
  }
}


/*******************************************************
  UNCERTAINTIES 
*/

function renderUncertainty(class_str_obj){
  
  mainMap.layers().reset();
  mainMap.widgets().reset();

  loadingOverlay.style().set('shown', true);
  ui.util.setTimeout(function(){loadingOverlay.style().set('shown', false);}, 10000);

  var model_list = scenarioModelDict[scenarioA.scenario];
  var selections = [];
  for (var i = 0; i < model_list.length; i++){
    selections.push([scenarioA.year, model_list[i], scenarioA.scenario]);
  }

  var uncert_selection_list = ee.List(selections);
  
  function main_fn_wrapper(triple){
    return kcModule.main_fn(triple, ic, order_months, ndays_months, summr_months, wintr_months);
  }

  var model_ic = ee.ImageCollection(uncert_selection_list.map(main_fn_wrapper));
  
  var class_str = ee.String(class_str_obj);
  var selected_class_num = class_list.indexOf(class_str);
  
  function uncert_fn(class_num_obj){

    var class_num = ee.Number(class_num_obj);
    
    function check_fn(im_obj){
      var im = ee.Image(im_obj);
      var check_im = im.eq(class_num);
      return check_im;
    }
    
    var check_ic = ee.ImageCollection(model_ic.map(check_fn));
    
    function change_band_name_fn(im){
      var bLabel = im.bandNames().get(0);
      return im.select([bLabel],['B1']);
    }
    
    var check_ic = ee.ImageCollection(check_ic.map(change_band_name_fn));
    var check_ic = ee.ImageCollection(check_ic.cast({B1:'int64'}, ['B1']));
    var count_im = check_ic.reduce(ee.Reducer.sum());
    var uncert_im = count_im.divide(model_ic.size()).multiply(100.0);
    return uncert_im;
  }
  
  var uncert_ic = ee.ImageCollection(class_seq_list.map(uncert_fn));
  mainMap.addLayer(ee.Image(uncert_ic.toList(uncert_ic.size()).get(selected_class_num)).sldStyle(uncertGrad));

  var clrgrad_panel = ui.Panel({style:clrgradpanelStyle});
  
  var clrgradTitle = ui.Label({
    value:'% of GCM Ensemble Agreement',
    style:clrgradlabelStyle
  });
  
  var clrgradmaxLabel = ui.Label({
    value:'100%',
    style:clrgradlabelStyle
  });

  var clrgradminLabel = ui.Label({
    value:'0%',
    style:clrgradlabelStyle
  });
  
  var lat = ee.Image.pixelLonLat().select('latitude');
  var gradient = lat.multiply(1.0);
  var clrgradImage = gradient.sldStyle(uncertGrad);
  var thumbnail = ui.Thumbnail({
    image:clrgradImage,
    params:clrgradVis, 
    style:clrgradthumbStyle
  });
  
  clrgrad_panel.add(clrgradTitle);
  clrgrad_panel.add(clrgradmaxLabel);
  clrgrad_panel.add(thumbnail);
  clrgrad_panel.add(clrgradminLabel);
  mainMap.add(clrgrad_panel);
}

/*******************************************************
  ASSEMBLE CONTROL PANELS
*/

var controlPanelA = ui.Panel({
  widgets:[
    appTitle,appSubTitle,
    ui.Label({value:'About/Legend', style:dropheaderlabelStyle}), infoCheckbox, legendCheckbox,
    ui.Label({value:'Click Tools', style:dropheaderlabelStyle}), inspectCheckbox, timelineCheckbox,
    ui.Label({value:'Class Uncertainty', style:dropheaderlabelStyle}), ui.Label('(for selected emissions and date range)'), uncertSelect,
    ui.Label({value:'Compare', style:dropheaderlabelStyle}), compareCheckbox,
    ui.Label({value:'Scenario A', style:dropheaderlabelStyle}),
    ui.Label('Emissions Scenario:'), scenarioADrop,
    ui.Label('GCM Model:'), modelADrop,
    ui.Label('Date Range:'), dateADrop],
  style:compareApanelStyle});

var controlPanelB = ui.Panel({
  widgets:[
    ui.Label({value:'Scenario B', style:dropheaderlabelStyle}),
    ui.Label('Emissions Scenario:'), scenarioBDrop,
    ui.Label('GCM Model:'), modelBDrop,
    ui.Label('Date Range:'), dateBDrop],
  style:compareBpanelStyle});

var mainControlPanel = ui.Panel({widgets:[controlPanelA, controlPanelB], style:mainpanelStyle});

// Assemble main layout
var linker = ui.Map.Linker([mainMap, splitMap]);
var splitPanel = ui.SplitPanel({firstPanel:mainMap, secondPanel:splitMap, wipe:true, style:splitpanelStyle});
var masterPanel = ui.Panel({widgets:[mainControlPanel, mainMap], layout:ui.Panel.Layout.flow('horizontal'), style:splitpanelStyle});

// Set up logic for comparison checkbox
function createCompareSplitUI(bool_obj){
  controlPanelB.style().set('shown', bool_obj);
  masterPanel.widgets().set(1, bool_obj ? splitPanel : mainMap);
};

/*******************************************************
  FINAL UI LAYOUT SETUP
*/

ui.root.setLayout(ui.Panel.Layout.absolute());
ui.root.clear();
ui.root.add(masterPanel);
ui.root.add(infoPanel);
ui.root.add(legendPanel);
ui.root.add(loadingOverlay); // Add the loading panel to the root so it can float over everything
ui.root.add(timelineLoadingPanel);
