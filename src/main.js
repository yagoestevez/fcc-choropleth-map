require( "babel-runtime/regenerator" );
require( './index.html'              );
require( './main.scss'               );

////////////////////////////////////////////////////////////////////////////////////////////////////
//                        by Yago Estévez. https://twitter.com/yagoestevez                        //
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

const API_URLs = [
  'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json',
  'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json'
]

// Data is fetched from the API or throws an error. If everything OK,
// the Choropleth Map is built using the data from the JSON document.
Promise.all( API_URLs.map( url =>
  fetch( url ).then( res => res.json( ) )
) ).then( data => {
  // Hides preloader.
  document.getElementById( 'preloader' ).classList.add( 'hidden' ); 
  // Builds the Choropleth Map.
  const getTheChart = new ChartBuilder( data );
  getTheChart.makeCanvas().drawMap().paintColor();
} )
.catch( error => { throw new Error( error ) } );

// The Chart Builder class. Responsible for building the actual Choropleth Map.
class ChartBuilder {

  constructor ( data ) {
    // Sets up sizes.
    this.chartWidth  = 1000;
    this.chartHeight = 700;
    this.margin      = { top: 30, bottom: 30, left: 30, right: 30 };
    this.innerWidth  = this.chartWidth  - this.margin.left - this.margin.right;
    this.innerHeight = this.chartHeight - this.margin.top  - this.margin.bottom;

    // Saves the data.
    this.counties    = data[0];
    this.education   = data[1];

    // Cleans up the data.
    this.data        = this.cleanUpData( );
  }

  // Cleans up the data.
  cleanUpData ( ) {
    const newData = [ ];
    this.counties.objects.counties.geometries.map( ( county, c_index ) => {
      this.education.map( edu => {
        if ( county.id !== edu.fips ) return;
        newData.push( {
          id       : edu.fips,
          area     : edu.area_name,
          state    : edu.state,
          bachelor : edu.bachelorsOrHigher
        } );
      } );
    } );
    return newData;
  }

  // Creates the canvas for the chart.
  makeCanvas ( ) {
    this.chart = d3.select( '#chart' )
      .attr( 'viewBox' , `0 0 ${this.chartWidth} ${this.chartHeight}` );
    this.canvas = this.chart.append( 'g' )
      .attr( 'transform', `translate( ${this.margin.left}, ${this.margin.top} )` );
    return this;
  }

  drawMap ( ) {  
    const geoPath = d3.geoPath( );
    // Draws the US map divided by counties.
    this.map = this.canvas.selectAll( 'path' )
      .data( topojson.feature( this.counties, this.counties.objects.counties ).features )
      .enter( )
      .append( 'path' )
        .attr( 'd'             , geoPath )
        .attr( 'class'         , 'county' )
        .attr( 'data-fips'     , d => d.id )
        .attr( 'data-education', d => this.data.find( data => data.id === d.id ).bachelor );

    // Overlays the US state borders.
    this.canvas.append("path")
      .attr( 'class', 'states' )
      .attr( 'd'    , geoPath( topojson.mesh( this.counties, this.counties.objects.states ) ) );

    return this;
  }

  // Paints the map with colors according to the data provided.
  paintColor ( ) {
    this.color = d3.scaleQuantize( )
      .range( [
        '#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#08519c','#08306b'
      ] )
      .domain( d3.extent( this.data, d => d.bachelor ) );

    this.map.attr( 'fill', d => {
      const bachelor = this.data.find( data => data.id === d.id ).bachelor;
      return this.color( bachelor );
    } );

    return this;
  }

}