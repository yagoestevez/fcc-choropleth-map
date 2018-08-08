/**
 *  Webpack Development Configuration.
 */
const path                  = require( 'path' ); // Adds 'path' module to the config.
const MiniCssExtractPlugin  = require( 'mini-css-extract-plugin' ); // Extracts CSS into files.

// Exports the configuration so that Webpack knows what we want it to do.
module.exports = {

  // Defines an entry point, where Webpack will look for the starter file(s).
  // More info: https://webpack.js.org/concepts/entry-points/
  entry: {
    main: './src/main.js'
  },

  // Defines the mode to be used by Webpack (development/production).
  // More info: https://webpack.js.org/concepts/mode/
  mode: 'development',

  // Defines the processed output to a specific location on your project structure.
  // More info: https://webpack.js.org/concepts/output/
  output: {
    filename    : 'bundle.js',                          // The name of the final js file with all
                                                        // the js code included.
    path        : path.resolve( __dirname, '../dist' ), // The path to store the output. The path is
                                                        // absolute, so path.resolve() is used.
    publicPath  : '/'                                   // The public path to store the output.
  },

  devServer: {
    contentBase : 'dist', // Tha path the dev server will use as its base directory.
                          // More info: https://webpack.js.org/configuration/dev-server/
    overlay     : true    // Shows the errors right in the browser window.
  },

  // Defines the module rules to apply for every file extension we want to work with.
  module: {
    rules: [
      {
        // Sets a rule for js files. The /\.js$/ part is a regular expression and it means that 
        // every file with a .js (\.js) in the end of its filename ($) should follow this rules.
        test: /\.js$/,
        exclude: /node_modules/,      // Excludes node_modules folder from being processed.
        use: [
          { loader: 'babel-loader' }  // Calls Babel loader for 'transpiling' new Javascript
        ]                             // features into code compatible with old browsers.
      },                              // Babel depends on .babelrc file, in the root directory.
      {
        // Sets a rule for css files. Also a regular expression, this time seeking .css files.
        test: /\.s?css$/,
        // Gives Webpack a way to work with the matching files.
        // NOTICE: The order of execution is reversed; the last items get executed first.
        use: [
          { loader: 'style-loader' },  // After css-loader has done its job, this loader adds CSS 
                                       // to the DOM by injecting a <style> tag.
                                       // More info: https://github.com/webpack-contrib/style-loader
          MiniCssExtractPlugin.loader, // Extracts the CSS into its own file on the dist directory.
          {
            loader: 'css-loader',      // First, css-loader interprets @import and url() like
                                       // import/require() and will resolve them. 
                                       // More info: https://github.com/webpack-contrib/css-loader
            options: {
              importLoaders: 1         // Configures how many loaders before css-loader should apply.
            }
          },
          'postcss-loader',            // Adds vendor prefixes to CSS rules from Can I Use.
          { loader: "sass-loader" }    // Compiles Scss/Sass code into CSS.
        ]
      },
      {
        // Same rule, this time for html files.
        test: /\.html$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]'      // Copies the file from the original directory to build/.
            }
          },                            // More info: https://webpack.js.org/loaders/file-loader/
          { loader: 'extract-loader' }, // Extracts HTML and CSS from the bundle into files.
                                        // More info: https://webpack.js.org/loaders/extract-loader/
          { loader: 'html-loader'    }  // Exports HTML string.
                                        // More info: https://webpack.js.org/loaders/html-loader/
        ]
      },
      {
        // Applies the following rules to image files: jpg, jpeg, png or gif.
        test: /\.(jpe?g|png|gif)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name]-[hash].[ext]',// Same as in the html rule.
              outputPath: 'images/'
            }
          }
        ]
      }
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({  // Creates a CSS file per JS file which contains CSS.
      filename: '[name].css',   // More info: https://github.com/webpack-contrib/mini-css-extract-plugin
    }),
  ]
}