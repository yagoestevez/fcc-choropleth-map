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
  getTheChart.makeCanvas().drawMap().paintColor().makeLegend().makeTooltip().and.handleEvents();
} )
.catch( error => { throw new Error( error ) } );

// The Chart Builder class. Responsible for building the actual Choropleth Map.
class ChartBuilder {

  constructor ( data ) {
    // Sets up sizes.
    this.chartWidth  = 1100;
    this.chartHeight = 700;
    this.margin      = { top: 60, bottom: 60, left: 60, right: 60 };
    this.innerWidth  = this.chartWidth  - this.margin.left - this.margin.right;
    this.innerHeight = this.chartHeight - this.margin.top  - this.margin.bottom;

    // Saves the data.
    this.counties    = data[0];
    this.education   = data[1];

    // Cleans up the data.
    this.data        = this.cleanUpData( );

    // Chains methods after instantiating.
    this.and         = this;
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
      .attr( 'viewBox' , `0 0 ${this.chartWidth} ${this.chartHeight}` )
      .attr( 'preserveAspectRatio', 'xMidYMid meet' );
    this.canvas = this.chart.append( 'g' )
      .attr( 'transform', `translate( ${this.margin.left}, ${this.margin.top} )` );
    return this;
  }

  drawMap ( ) {  
    const geoPath = d3.geoPath( );

    // Draws the US map divided by counties.
    this.county = this.canvas.selectAll( 'path' )
      .data( topojson.feature( this.counties, this.counties.objects.counties ).features )
      .enter( )
      .append( 'path' )
        .attr( 'd'             , geoPath )
        .attr( 'class'         , 'county' )
        .attr( 'data-fips'     , d => d.id )
        .attr( 'data-education', d => this.data.find( data => data.id === d.id ).bachelor )
        .attr( 'data-area'     , d => this.data.find( data => data.id === d.id ).area )
        .attr( 'data-state'    , d => this.data.find( data => data.id === d.id ).state );

    // Overlays the US state borders.
    this.canvas.append("path")
      .attr( 'class', 'state' )
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

    this.county.attr( 'fill', d => {
      const bachelor = this.data.find( data => data.id === d.id ).bachelor;
      return this.color( bachelor );
    } );

    return this;
  }

  // Creates the legend items from the chart.
  makeLegend ( ) {
    const legend = this.chart.append( 'g' )
      .attr( 'id', 'legend' );
    legend.selectAll( 'rect' )
      .data( this.color.range( ) )
      .enter( )
      .append( 'rect' )
        .attr( 'class' , 'legend' )
        .attr( 'width' , 50 )
        .attr( 'height', 20 )
        .attr( 'x'     , ( d, i ) => i * 50 )
        .attr( 'y'     , 30 )
        .attr( 'fill'  , d => d );

    const start = this.color.domain( )[0];
    const step  = ( this.color.domain( )[1] - this.color.domain( )[0] ) / this.color.range( ).length;
    legend.selectAll( 'text' )
      .data( this.color.range( ) )
      .enter( )
      .append( 'text' )
        .attr( 'x'     , ( d, i ) => ( i * 50 ) + 50 )
        .attr( 'y'     , 70 )
        .text( ( d, i )=> ( start + ( i + 1 ) * step ).toFixed( 1 ) );
    legend.attr( 'transform', `translate( ${ this.chartWidth / 2 }, 0 )` );

    return this;
  }

  // Creates the tooltip to display when hover each county.
  makeTooltip ( ) {
    this.tip = d3.tip( )
      .attr( 'id', 'tooltip' )
      .html( d => d );
    this.canvas.call( this.tip );
    return this;
  }

  // Sets up the event handlers for each county path.
  handleEvents ( ) {
    let _self = this;
    this.county
    .on( 'mouseover', function ( d,i ) {
      let activeCounty = d3.select( this );
      activeCounty = {
        education: activeCounty.attr( 'data-education' ),
        state    : activeCounty.attr( 'data-state' ),
        area     : activeCounty.attr( 'data-area' )
      }
      const tipText = `
        <h4 class="title">
          ${activeCounty.area} (${activeCounty.state})
          <hr />
        </h4>
        <div class="desc">
          <p>
            In <b>${activeCounty.area} (${activeCounty.state})</b>, 
            ${activeCounty.education < 20 ? 'only' : '' } around 
            <b>${activeCounty.education}%</b> adults (<em>25yo and older</em>) 
            have a bachelor's degree or higher.
          </p>
        </div>
      `;
      const browserWidth = document.querySelector( 'html' ).clientWidth;
      _self.tip.attr( 'data-education', activeCounty.education )
               .direction( d3.event.x < browserWidth / 2 ? 'e' : 'w' )
               .offset( d3.event.x < browserWidth / 2 ? [ 0, 50 ] : [ 0, -50 ] )
               .show( tipText );
    } )
    .on( 'mouseout', function ( d,i ) {
      _self.tip.hide( );
    } );
  }

}