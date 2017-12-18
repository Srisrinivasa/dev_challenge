
require('./site/index.html')
require('./site/style.css')
global.DEBUG = false

const url = "ws://localhost:8011/stomp"
const client = Stomp.client(url)
client.debug = function (msg) {
  if (global.DEBUG) {
    console.info(msg)
  }
}


var rawData = [];

client.connect({}, fetchData, function (error) {
  alert(error.headers.message)
});

/*******************************************************************************/
/*******************************************************************************/
/*******************************************************************************/
/************************   code starts from here      *************************/
/*******************************************************************************/
/*******************************************************************************/
/*******************************************************************************/



/* 
 * "fetchData" function to fetch price updates
 * Retrieved data is stored in "rawData"
*/

function fetchData() {
  client.subscribe("/fx/prices", function (data) {           //subscribing for updates
    rawData.push(JSON.parse(data.body));                      //storing retrived data
  });
}

/*
  *setinterval to poll for updates every 5 seconds
*/

setInterval(() => {
  var TableData = getTableData(rawData);           //  method to get table data   ------step 1
  var midPoints = getMidpoints(rawData);            //  method to get midpoints for sparkline -------step 2

  displayTableData(TableData, midPoints);           // method to display table data -----step 3

}, 5000);


/*
  method to get table data by following steps
  * step: 1-1   finds unique names from table
  * step: 1-2   among the whole data, groups by name using unique names and finds the lastchanged best bid
  * step: 1-3   sorting the final obtained data
*/

function getTableData(rawData) {                     // initial method step - 1

  var uniqueNames = getUniqueNames(rawData);          // calling getUniqueNames method (step 1-1)

  // calling getLastChangedBestData method (step 1-2)   
  var lastChangedBestData = getLastChangedBestData(uniqueNames, rawData);


  // calling getSortedData method (step 1-3) and returning it to calling function
  return getSortedData(lastChangedBestData);

}


function getUniqueNames(rawData) {               // step 1-1 fetching unique names
  var uniqueData = [];
  for (var i = 0; i < rawData.length; i++) {
    if (uniqueData.indexOf(rawData[i].name) === -1) {
      uniqueData.push(rawData[i].name);
    }
  }
  return uniqueData;
}

function getLastChangedBestData(uniqueNames, rawData) {         //step 1-2 fetch last best changed updates
  var data = [];
  for (var i = 0; i < uniqueNames.length; i++) {
    var currentBestdata = {};
    for (var j = 0; j < rawData.length; j++) {
      if (uniqueNames[i] == rawData[j].name) {
        if ((Object.getOwnPropertyNames(currentBestdata).length === 0) || (currentBestdata.lastChangeBid < rawData[j].lastChangeBid)) {
          currentBestdata = rawData[j];
        }
      }
    }
    data.push(currentBestdata);
  }
  return data;
}

function getSortedData(unsortedData) {                   // step 1-3   sorting the unsorted data
  var sorted = unsortedData.sort(function (curr, next) {
    return next.lastChangeBid - curr.lastChangeBid;
  });
  return sorted;
}


/*
  * getMidpoints will take raw data as input and gives midpoints as Object as below
  * Output is an object with name and points(array)

  sparklines = {
                name:"gbpjpy"
                
                points: [
                    159.96879922799354,
                    156.49798906875006,
                    159.594938427909
                    ]
                }
*/
function getMidpoints(rawData) {           // step 2
  var sparklinePoints = [];
  var uniqueNames = getUniqueNames(rawData);
  for (var i = 0; i < uniqueNames.length; i++) {                        //iterating loop for uniqueNames list length
    var pointsArray = [];
    for (var j = 0; j < rawData.length; j++) {                          //iterating loop to get multiple midpoints of same name
      if (uniqueNames[i] == rawData[j].name) {
        pointsArray.push(
          (rawData[j].bestBid + rawData[j].bestAsk) / 2                  // calculating the midpoint value
        );
      }
    }
    sparklinePoints.push({ name: uniqueNames[i], points: pointsArray });      // storing the points along with name
  }
  return sparklinePoints;
}


/*
  * Displays the table data --------step -3
*/

function displayTableData(tableBody, midPoints) {            // step -3 displaying data
  var body = [];
  for (var i = 0; i < tableBody.length; i++) {                // generating body of table for multiple iterations
    body +=
      "<tr>" +
      "<td>" + tableBody[i].name + "</td>" +
      "<td>" + tableBody[i].bestAsk + "</td>" +
      "<td>" + tableBody[i].bestBid + "</td>" +
      "<td>" + tableBody[i].lastChangeAsk + "</td>" +
      "<td>" + tableBody[i].lastChangeBid + "</td>" +
      "<td>" + tableBody[i].openAsk + "</td>" +
      "<td>" + tableBody[i].openBid + "</td>" +
      "<td>" + "<span id='spark" + i + "'/>" + "</td>"
    "</tr>";
  }
  document.getElementById('table-body').innerHTML = body;
  for (var i = 0; i < tableBody.length; i++) {
    drawSparkLine(tableBody[i].name, midPoints);         // calling a method where it draws a sparkline
  }
}

function drawSparkLine(name, midPoints) {                        // method to generate sparkline
  for (var i = 0; i < midPoints.length; i++) {
    if (name == midPoints[i].name) {                              //checking the name from midpoints array
      var finalPoints = []
      if (midPoints[i].points.length > 6) {
        finalPoints = midPoints[i].points.splice(0, (midPoints[i].points.length - 6));
      }
      else {
        finalPoints = midPoints[i].points;
      }
      Sparkline.draw(document.getElementById('spark' + i), midPoints[i].points);   //generating the sparkline
    }
  }
}

